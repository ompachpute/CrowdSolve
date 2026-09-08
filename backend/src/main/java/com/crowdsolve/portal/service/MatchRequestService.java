package com.crowdsolve.portal.service;

import com.crowdsolve.portal.dto.MatchRequestRequest;
import com.crowdsolve.portal.dto.MatchRequestResponse;
import com.crowdsolve.portal.entity.MatchRequest;
import com.crowdsolve.portal.entity.Problem;
import com.crowdsolve.portal.entity.Team;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.MatchRequestRepository;
import com.crowdsolve.portal.repository.ProblemRepository;
import com.crowdsolve.portal.repository.TeamRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchRequestService {

    private final MatchRequestRepository matchRequestRepository;
    private final ProblemRepository problemRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String aiUrl = "http://localhost:8000";

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

    public MatchRequestResponse create(MatchRequestRequest request) {
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        User industry = null;
        if (request.getIndustryId() != null) {
            industry = userRepository.findById(request.getIndustryId())
                    .orElseThrow(() -> new RuntimeException("Industry not found"));
        }
        MatchRequest matchRequest = MatchRequest.builder()
                .problem(problem)
                .team(team)
                .industry(industry)
                .initiatedBy(request.getInitiatedBy())
                .source(request.getSource())
                .notes(request.getNotes())
                .fundingAmount(request.getFundingAmount())
                .status("PENDING")
                .build();
        MatchRequest saved = matchRequestRepository.save(matchRequest);
        problem.setStatus("MATCHED");
        problemRepository.save(problem);
        return toResponse(saved);
    }

    public List<MatchRequestResponse> findTeamRequests() {
        User user = currentUser();
        List<Team> teams = teamRepository.findByLeaderId(user.getId());
        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        return matchRequestRepository.findAll().stream()
                .filter(m -> teamIds.contains(m.getTeam().getId()))
                .filter(m -> "TEAM".equals(m.getInitiatedBy()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MatchRequestResponse> findIndustryRequests() {
        User user = currentUser();
        return matchRequestRepository.findAll().stream()
                .filter(m -> m.getIndustry() != null && m.getIndustry().getId().equals(user.getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MatchRequestResponse accept(Long id) {
        MatchRequest matchRequest = matchRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match request not found"));
        matchRequest.setStatus("ACCEPTED");
        MatchRequest saved = matchRequestRepository.save(matchRequest);
        MatchRequestResponse resp = toResponse(saved);
        if (matchRequest.getProblem() != null) {
            Problem problem = matchRequest.getProblem();
            if ("MATCHED".equals(problem.getStatus())) {
                problem.setStatus("IN_PROGRESS");
                problemRepository.save(problem);
            }
        }
        if (matchRequest.getIndustry() != null) {
            resp.setContactEmail(matchRequest.getIndustry().getEmail());
            resp.setContactPhone(matchRequest.getIndustry().getPhone());
            resp.setContactName(matchRequest.getIndustry().getName());
        } else {
            resp.setContactEmail(matchRequest.getTeam().getLeader().getEmail());
            resp.setContactPhone(matchRequest.getTeam().getLeader().getPhone());
            resp.setContactName(matchRequest.getTeam().getLeader().getName());
        }
        return resp;
    }

    public MatchRequestResponse reject(Long id) {
        MatchRequest matchRequest = matchRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match request not found"));
        matchRequest.setStatus("REJECTED");
        MatchRequest saved = matchRequestRepository.save(matchRequest);
        return toResponse(saved);
    }

    public List<MatchRequestResponse> aiMatch(Long problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        Map<String, Object> payload = Map.of(
                "title", problem.getTitle(),
                "description", problem.getDescription(),
                "category", problem.getCategory(),
                "severity", problem.getSeverity() != null ? problem.getSeverity() : "MEDIUM"
        );
        try {
            Map<String, Object> response = restTemplate.postForObject(aiUrl + "/ai/match", payload, Map.class);
            if (response != null && response.get("candidates") instanceof List<?> candidates) {
                for (Object candidateObj : candidates) {
                    Map<String, Object> match = (Map<String, Object>) candidateObj;
                    Number teamIdNum = (Number) match.get("teamId");
                    if (teamIdNum == null) {
                        continue;
                    }
                    Team team = teamRepository.findById(teamIdNum.longValue()).orElse(null);
                    if (team != null) {
                        MatchRequest matchRequest = MatchRequest.builder()
                                .problem(problem)
                                .team(team)
                                .initiatedBy("INDUSTRY_NGO")
                                .source("SYSTEM_MATCH")
                                .status("PENDING")
                                .build();
                        matchRequestRepository.save(matchRequest);
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
        return findIndustryRequests();
    }

    private MatchRequestResponse toResponse(MatchRequest m) {
        return MatchRequestResponse.builder()
                .id(m.getId())
                .problemId(m.getProblem().getId())
                .teamId(m.getTeam().getId())
                .industryId(m.getIndustry() != null ? m.getIndustry().getId() : null)
                .initiatedBy(m.getInitiatedBy())
                .source(m.getSource())
                .status(m.getStatus())
                .notes(m.getNotes())
                .createdAt(m.getCreatedAt())
                .fundingAmount(m.getFundingAmount())
                .build();
    }
}