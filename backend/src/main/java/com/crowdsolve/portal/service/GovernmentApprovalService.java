package com.crowdsolve.portal.service;

import com.crowdsolve.portal.dto.GovernmentApprovalRequest;
import com.crowdsolve.portal.entity.GovernmentApproval;
import com.crowdsolve.portal.entity.Problem;
import com.crowdsolve.portal.entity.Prototype;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.GovernmentApprovalRepository;
import com.crowdsolve.portal.repository.ProblemRepository;
import com.crowdsolve.portal.repository.PrototypeRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GovernmentApprovalService {

    private final GovernmentApprovalRepository approvalRepository;
    private final PrototypeRepository prototypeRepository;
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

    public GovernmentApproval create(GovernmentApprovalRequest request) {
        Prototype prototype = prototypeRepository.findById(request.getPrototypeId())
                .orElseThrow(() -> new RuntimeException("Prototype not found"));
        User approvedBy = new User();
        approvedBy.setId(request.getApprovedBy());
        GovernmentApproval approval = GovernmentApproval.builder()
                .prototype(prototype)
                .approvedBy(approvedBy)
                .status("APPROVED")
                .build();
        GovernmentApproval saved = approvalRepository.save(approval);
        if ("APPROVED".equals(saved.getStatus())) {
            Problem problem = prototype.getProblem();
            if (problem != null) {
                problem.setStatus("SOLVED");
                problemRepository.save(problem);
            }
        }
        return saved;
    }
}