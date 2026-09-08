package com.crowdsolve.portal.service;

import com.crowdsolve.portal.dto.PrototypeRequest;
import com.crowdsolve.portal.dto.PrototypeResponse;
import com.crowdsolve.portal.entity.Funding;
import com.crowdsolve.portal.entity.Prototype;
import com.crowdsolve.portal.entity.Team;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.FundingRepository;
import com.crowdsolve.portal.repository.PrototypeRepository;
import com.crowdsolve.portal.repository.ProblemRepository;
import com.crowdsolve.portal.repository.TeamRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrototypeService {

    private final PrototypeRepository prototypeRepository;
    private final ProblemRepository problemRepository;
    private final TeamRepository teamRepository;
    private final FundingRepository fundingRepository;
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

    public PrototypeResponse create(PrototypeRequest request) {
        User user = currentUser();
        var problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        List<Team> teams = teamRepository.findByLeaderId(user.getId());
        var team = teams.stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No team found for current user"));
        User industry = null;
        if (request.getIndustryId() != null) {
            industry = userRepository.findById(request.getIndustryId())
                    .orElseThrow(() -> new RuntimeException("Industry not found"));
        }
        Prototype prototype = Prototype.builder()
                .problem(problem)
                .team(team)
                .industry(industry)
                .description(request.getDescription())
                .fileUrl(request.getFileUrl())
                .repoLink(request.getRepoLink())
                .pptUrl(request.getPptUrl())
                .status("SUBMITTED")
                .build();
        Prototype saved = prototypeRepository.save(prototype);
        return toResponse(saved);
    }

    public List<PrototypeResponse> findAll() {
        return prototypeRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PrototypeResponse> findMine() {
        User user = currentUser();
        List<Team> teams = teamRepository.findByLeaderId(user.getId());
        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        return prototypeRepository.findAll().stream()
                .filter(p -> p.getTeam() != null && teamIds.contains(p.getTeam().getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PrototypeResponse> findByProblem(Long problemId) {
        return prototypeRepository.findAll().stream()
                .filter(p -> p.getProblem() != null && problemId.equals(p.getProblem().getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PrototypeResponse fund(Long id) {
        Prototype prototype = prototypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prototype not found"));
        prototype.setStatus("FUNDING_COMMITTED");
        Prototype saved = prototypeRepository.save(prototype);

        User funder = currentUser();
        Funding funding = Funding.builder()
                .prototype(saved)
                .problem(saved.getProblem())
                .funder(funder)
                .fundingType("PROTOTYPE_FUNDING")
                .status("PLEDGED")
                .build();
        fundingRepository.save(funding);

        if (saved.getProblem() != null) {
            var problem = saved.getProblem();
            problem.setIsFunded(true);
            problem.setFundedBy("GOVERNMENT".equalsIgnoreCase(funder.getRole()) ? "GOVERNMENT" : "INDUSTRY_NGO");
            problemRepository.save(problem);
        }

        return toResponse(saved);
    }

    public PrototypeResponse approve(Long id) {
        Prototype prototype = prototypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prototype not found"));
        prototype.setStatus("GOVERNMENT_APPROVED");
        Prototype saved = prototypeRepository.save(prototype);
        return toResponse(saved);
    }

    private PrototypeResponse toResponse(Prototype p) {
        String fundingStatus = fundingRepository.findAll().stream()
                .filter(f -> f.getPrototype() != null && f.getPrototype().getId().equals(p.getId()))
                .findFirst()
                .map(Funding::getStatus)
                .orElse(null);
        
        String teamName = null;
        String teamEmail = null;
        if (p.getTeam() != null) {
            teamName = p.getTeam().getName();
            if (p.getTeam().getLeader() != null) {
                teamEmail = p.getTeam().getLeader().getEmail();
            }
        }
        
        String industryName = null;
        String industryEmail = null;
        if (p.getIndustry() != null) {
            industryName = p.getIndustry().getOrganization();
            if (industryName == null || industryName.isEmpty()) {
                industryName = p.getIndustry().getName();
            }
            industryEmail = p.getIndustry().getEmail();
        }
        
        return PrototypeResponse.builder()
                .id(p.getId())
                .problemId(p.getProblem() != null ? p.getProblem().getId() : null)
                .problemTitle(p.getProblem() != null ? p.getProblem().getTitle() : null)
                .teamId(p.getTeam() != null ? p.getTeam().getId() : null)
                .teamName(teamName)
                .teamEmail(teamEmail)
                .industryId(p.getIndustry() != null ? p.getIndustry().getId() : null)
                .industryName(industryName)
                .industryEmail(industryEmail)
                .description(p.getDescription())
                .fileUrl(p.getFileUrl())
                .repoLink(p.getRepoLink())
                .pptUrl(p.getPptUrl())
                .status(p.getStatus())
                .fundingStatus(fundingStatus)
                .createdAt(p.getCreatedAt())
                .build();
    }
}