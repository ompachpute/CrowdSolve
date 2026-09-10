package com.crowdsolve.portal.service;

import com.crowdsolve.portal.dto.ProblemRequest;
import com.crowdsolve.portal.dto.ProblemResponse;
import com.crowdsolve.portal.dto.PrototypeResponse;
import com.crowdsolve.portal.entity.DuplicateLink;
import com.crowdsolve.portal.entity.Funding;
import com.crowdsolve.portal.entity.Problem;
import com.crowdsolve.portal.entity.Prototype;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.DuplicateLinkRepository;
import com.crowdsolve.portal.repository.FundingRepository;
import com.crowdsolve.portal.repository.ProblemRepository;
import com.crowdsolve.portal.repository.PrototypeRepository;
import com.crowdsolve.portal.repository.TeamRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final DuplicateLinkRepository duplicateLinkRepository;
    private final PrototypeRepository prototypeRepository;
    private final FundingRepository fundingRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
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

    public ProblemResponse create(ProblemRequest request) {
        Problem problem = Problem.builder()
                .reporter(currentUser())
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .severity(request.getSeverity())
                .photoUrl(request.getPhotoUrl())
                .videoUrl(request.getVideoUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .status("SUBMITTED")
                .isFunded(false)
                .build();
        Problem saved = problemRepository.save(problem);
        enrichAddressFromCoordinates(saved);

        try {
            Map<String, Object> structPayload = Map.of(
                    "title", saved.getTitle(),
                    "description", saved.getDescription()
            );
            Map<String, Object> structResponse = restTemplate.postForObject(aiUrl + "/ai/structure", structPayload, Map.class);
            if (structResponse != null) {
                saved.setCategory((String) structResponse.get("category"));
                saved.setSeverity((String) structResponse.get("severity"));
            }

            float[] embedding = generateEmbedding(saved.getTitle() + " " + saved.getDescription());
            Map<String, Object> dupPayload = new HashMap<>();
            dupPayload.put("embedding", embedding);
            dupPayload.put("address", saved.getAddress());
            dupPayload.put("latitude", saved.getLatitude());
            dupPayload.put("longitude", saved.getLongitude());
            Map<String, Object> dupResponse = restTemplate.postForObject(aiUrl + "/ai/duplicate-check", dupPayload, Map.class);
            if (dupResponse != null && Boolean.TRUE.equals(dupResponse.get("isDuplicate"))) {
                Number dupIdNum = (Number) dupResponse.get("duplicateOfId");
                Number simNum = (Number) dupResponse.get("similarityScore");
                if (dupIdNum != null && simNum != null && simNum.doubleValue() > 0.85) {
                    Problem duplicateOf = problemRepository.findById(dupIdNum.longValue())
                            .orElseThrow(() -> new RuntimeException("Duplicate problem not found"));
                    DuplicateLink link = DuplicateLink.builder()
                            .problem(saved)
                            .duplicateOfProblem(duplicateOf)
                            .similarityScore(simNum.doubleValue())
                            .build();
                    duplicateLinkRepository.save(link);
                }
            }
            problemRepository.save(saved);
        } catch (Exception e) {
            problemRepository.save(saved);
        }

        return toResponse(saved);
    }

    @SuppressWarnings("unchecked")
    private void enrichAddressFromCoordinates(Problem problem) {
        // Reverse geocoding is intentionally disabled — no external map API calls.
    }

    private String firstNonBlank(Object... values) {
        for (Object v : values) {
            if (v != null) {
                String s = v.toString().trim();
                if (!s.isEmpty()) {
                    return s;
                }
            }
        }
        return null;
    }

    private float[] generateEmbedding(String text) {
        String normalized = text.toLowerCase().replaceAll("[^a-z0-9\\s]", "");
        String[] words = normalized.split("\\s+");
        float[] embedding = new float[384];
        int prime = 31;
        for (int i = 0; i < words.length && i < 384; i++) {
            int hash = 0;
            for (char c : words[i].toCharArray()) {
                hash = prime * hash + c;
            }
            embedding[i] = (float) (Math.sin(hash) * 0.5 + 0.5);
        }
        return embedding;
    }

    public Optional<Problem> findById(Long id) {
        return problemRepository.findById(id);
    }

    public List<ProblemResponse> findAll() {
        return problemRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProblemResponse> findMine() {
        Long userId = currentUser().getId();
        return problemRepository.findByReporterId(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProblemResponse> findWithPrototypes() {
        List<Prototype> prototypes = prototypeRepository.findAll();
        Map<Long, List<Prototype>> prototypesByProblem = prototypes.stream()
                .filter(p -> p.getProblem() != null)
                .collect(Collectors.groupingBy(p -> p.getProblem().getId()));
        return problemRepository.findAll().stream()
                .map(p -> {
                    ProblemResponse resp = toResponse(p);
                    resp.setPrototypes(prototypesByProblem.getOrDefault(p.getId(), List.of()).stream()
                            .map(proto -> {
                                String teamName = null;
                                String teamEmail = null;
                                if (proto.getTeam() != null) {
                                    teamName = proto.getTeam().getName();
                                    if (proto.getTeam().getLeader() != null) {
                                        teamEmail = proto.getTeam().getLeader().getEmail();
                                    }
                                }
                                String industryName = null;
                                String industryEmail = null;
                                if (proto.getIndustry() != null) {
                                    industryName = proto.getIndustry().getOrganization();
                                    if (industryName == null || industryName.isEmpty()) {
                                        industryName = proto.getIndustry().getName();
                                    }
                                    industryEmail = proto.getIndustry().getEmail();
                                }
                                return PrototypeResponse.builder()
                                        .id(proto.getId())
                                        .problemId(proto.getProblem() != null ? proto.getProblem().getId() : null)
                                        .teamId(proto.getTeam() != null ? proto.getTeam().getId() : null)
                                        .teamName(teamName)
                                        .teamEmail(teamEmail)
                                        .industryId(proto.getIndustry() != null ? proto.getIndustry().getId() : null)
                                        .industryName(industryName)
                                        .industryEmail(industryEmail)
                                        .description(proto.getDescription())
                                        .fileUrl(proto.getFileUrl())
                                        .repoLink(proto.getRepoLink())
                                        .pptUrl(proto.getPptUrl())
                                        .status(proto.getStatus())
                                        .createdAt(proto.getCreatedAt())
                                        .build();
                            })
                            .toList());
                    return resp;
                })
                .collect(Collectors.toList());
    }

    public List<ProblemResponse> findSolved() {
        return problemRepository.findByStatus("SOLVED").stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProblemResponse> findSolvedByFunder() {
        User user = currentUser();
        return problemRepository.findByFundedBy(user.getRole()).stream()
                .filter(p -> "SOLVED".equals(p.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ProblemResponse> findInProgress() {
        return problemRepository.findByStatus("IN_PROGRESS").stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProblemResponse> findSolvedByTeam() {
        User currentUser = currentUser();
        var team = teamRepository.findByLeaderId(currentUser.getId()).stream().findFirst()
                .orElse(null);
        if (team == null) {
            return List.of();
        }
        Set<Long> solvedProblemIds = prototypeRepository.findByTeamId(team.getId()).stream()
                .map(p -> p.getProblem() != null ? p.getProblem().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return problemRepository.findAll().stream()
                .filter(p -> "SOLVED".equals(p.getStatus()) && solvedProblemIds.contains(p.getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProblemResponse markSolved(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        User user = currentUser();
        if ("CITIZEN".equalsIgnoreCase(user.getRole())
                && (problem.getReporter() == null || !user.getId().equals(problem.getReporter().getId()))) {
            throw new RuntimeException("Citizens can only mark their own complaints as solved");
        }
        problem.setStatus("SOLVED");
        Problem saved = problemRepository.save(problem);

        List<DuplicateLink> linkedDuplicates = duplicateLinkRepository.findAll().stream()
                .filter(link -> link.getDuplicateOfProblem() != null
                        && link.getDuplicateOfProblem().getId().equals(saved.getId()))
                .toList();
        for (DuplicateLink link : linkedDuplicates) {
            if (link.getProblem() != null) {
                Problem duplicate = link.getProblem();
                if (!"SOLVED".equals(duplicate.getStatus())) {
                    duplicate.setStatus("SOLVED");
                    problemRepository.save(duplicate);
                }
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public void deleteProblem(Long id) {
        User user = currentUser();
        if (!"GOVERNMENT".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Only government officials can delete complaints");
        }
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        problemRepository.delete(problem);
    }

    public ProblemResponse sponsor(Long id) {
        User sponsor = currentUser();
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        problem.setIsFunded(true);
        problem.setFundedBy("INDUSTRY_NGO".equalsIgnoreCase(sponsor.getRole()) ? "INDUSTRY_NGO" : "GOVERNMENT");
        Problem saved = problemRepository.save(problem);

        Funding funding = Funding.builder()
                .problem(saved)
                .funder(sponsor)
                .fundingType("SPONSORSHIP")
                .status("PLEDGED")
                .build();
        fundingRepository.save(funding);

        return toResponse(saved);
    }

    public ProblemResponse aiStructure(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        Map<String, Object> payload = Map.of(
                "title", problem.getTitle(),
                "description", problem.getDescription()
        );
        try {
            Map<String, Object> response = restTemplate.postForObject(aiUrl + "/ai/structure", payload, Map.class);
            if (response != null) {
                problem.setCategory((String) response.get("category"));
                problem.setSeverity((String) response.get("severity"));
                problem.setStatus("STRUCTURED");
                problemRepository.save(problem);
            }
        } catch (Exception e) {
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
        return toResponse(problem);
    }

    public ProblemResponse aiDuplicateCheck(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        float[] embedding = generateEmbedding(problem.getTitle() + " " + problem.getDescription());
        Map<String, Object> payload = Map.of("embedding", embedding);
        try {
            Map<String, Object> response = restTemplate.postForObject(aiUrl + "/ai/duplicate-check", payload, Map.class);
            if (response != null) {
                Object dupObj = response.get("duplicateOfId");
                Object simObj = response.get("similarityScore");
                if (dupObj != null && simObj != null) {
                    Long duplicateOfId = ((Number) dupObj).longValue();
                    Double similarityScore = ((Number) simObj).doubleValue();
                    if (similarityScore > 0.85) {
                        Problem duplicateOf = problemRepository.findById(duplicateOfId)
                                .orElseThrow(() -> new RuntimeException("Duplicate problem not found"));
                        problem.setStatus("DUPLICATE_REJECTED");
                        problemRepository.save(problem);
                        DuplicateLink link = DuplicateLink.builder()
                                .problem(problem)
                                .duplicateOfProblem(duplicateOf)
                                .similarityScore(similarityScore)
                                .build();
                        duplicateLinkRepository.save(link);
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
        return toResponse(problem);
    }

    public ProblemResponse toResponse(Problem problem) {
        boolean hasPrototypes = prototypeRepository.findByProblemId(problem.getId()) != null
                && !prototypeRepository.findByProblemId(problem.getId()).isEmpty();
        return ProblemResponse.builder()
                .id(problem.getId())
                .reporterId(problem.getReporter() != null ? problem.getReporter().getId() : null)
                .title(problem.getTitle())
                .description(problem.getDescription())
                .category(problem.getCategory())
                .severity(problem.getSeverity())
                .photoUrl(problem.getPhotoUrl())
                .videoUrl(problem.getVideoUrl())
                .latitude(problem.getLatitude())
                .longitude(problem.getLongitude())
                .address(problem.getAddress())
                .status(problem.getStatus())
                .isFunded(problem.getIsFunded())
                .fundedBy(problem.getFundedBy())
                .createdAt(problem.getCreatedAt())
                .hasPrototypes(hasPrototypes)
                .build();
    }
}