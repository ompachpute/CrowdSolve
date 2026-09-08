package com.crowdsolve.portal.service;

import com.crowdsolve.portal.entity.*;
import com.crowdsolve.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final MatchRequestRepository matchRequestRepository;
    private final PrototypeRepository prototypeRepository;
    private final FundingRepository fundingRepository;

    public Map<String, Object> getDashboardStats() {
        List<Problem> allProblems = problemRepository.findAll();
        long totalProblems = allProblems.size();
        long totalSolved = allProblems.stream().filter(p -> "SOLVED".equals(p.getStatus())).count();
        long totalInProgress = allProblems.stream().filter(p -> "IN_PROGRESS".equals(p.getStatus())).count();
        long totalPrototypes = prototypeRepository.count();

        Map<String, Long> categoryCounts = allProblems.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(Problem::getCategory, Collectors.counting()));
        List<Map<String, Object>> categoryBreakdown = categoryCounts.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("category", e.getKey());
                    m.put("count", e.getValue());
                    return m;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")))
                .collect(Collectors.toList());

        List<Map<String, Object>> locationBreakdown = allProblems.stream()
                .filter(p -> p.getAddress() != null && !p.getAddress().isBlank())
                .collect(Collectors.groupingBy(Problem::getAddress, Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("location", e.getKey());
                    m.put("count", e.getValue());
                    return m;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProblems", totalProblems);
        stats.put("totalTeams", teamRepository.count());
        stats.put("totalMatchRequests", matchRequestRepository.count());
        stats.put("totalPrototypes", totalPrototypes);
        stats.put("totalFundings", fundingRepository.count());
        stats.put("totalSolved", totalSolved);
        stats.put("totalInProgress", totalInProgress);
        stats.put("categoryBreakdown", categoryBreakdown);
        stats.put("locationBreakdown", locationBreakdown);
        return stats;
    }
}