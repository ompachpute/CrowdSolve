package com.crowdsolve.portal.service;

import com.crowdsolve.portal.dto.FundingRequest;
import com.crowdsolve.portal.dto.FundingResponse;
import com.crowdsolve.portal.entity.Funding;
import com.crowdsolve.portal.entity.Problem;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.FundingRepository;
import com.crowdsolve.portal.repository.ProblemRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FundingService {

    private final FundingRepository fundingRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails userDetails) {
            username = userDetails.getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public FundingResponse create(FundingRequest request) {
        User funder = userRepository.findById(request.getFunderId())
                .orElseThrow(() -> new RuntimeException("Funder not found"));
        Problem problem = null;
        if (request.getProblemId() != null) {
            problem = problemRepository.findById(request.getProblemId())
                    .orElseThrow(() -> new RuntimeException("Problem not found"));
        }
        Funding funding = Funding.builder()
                .problem(problem)
                .funder(funder)
                .fundingType(request.getFundingType())
                .amount(request.getAmount())
                .status("PLEDGED")
                .build();
        Funding saved = fundingRepository.save(funding);
        if (problem != null) {
            problem.setIsFunded(true);
            String fundedBy = "INDUSTRY_NGO";
            if ("GOVERNMENT".equalsIgnoreCase(funder.getRole())) {
                fundedBy = "GOVERNMENT";
            }
            problem.setFundedBy(fundedBy);
            problemRepository.save(problem);
        }
        return toResponse(saved);
    }

    public List<FundingResponse> findMine() {
        User user = currentUser();
        return fundingRepository.findByFunderId(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FundingResponse toResponse(Funding f) {
        return FundingResponse.builder()
                .id(f.getId())
                .problemId(f.getProblem() != null ? f.getProblem().getId() : null)
                .problemTitle(f.getProblem() != null ? f.getProblem().getTitle() : null)
                .prototypeId(f.getPrototype() != null ? f.getPrototype().getId() : null)
                .funderId(f.getFunder().getId())
                .fundingType(f.getFundingType())
                .amount(f.getAmount())
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .build();
    }
}