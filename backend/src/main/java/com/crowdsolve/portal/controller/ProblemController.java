package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.MessageResponse;
import com.crowdsolve.portal.dto.ProblemRequest;
import com.crowdsolve.portal.dto.ProblemResponse;
import com.crowdsolve.portal.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<ProblemResponse> create(@Valid @RequestBody ProblemRequest request) {
        return ResponseEntity.ok(problemService.create(request));
    }

@GetMapping
    public ResponseEntity<List<ProblemResponse>> getAll() {
        return ResponseEntity.ok(problemService.findAll());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ProblemResponse>> getMine() {
        return ResponseEntity.ok(problemService.findMine());
    }

    @GetMapping("/with-prototypes")
    public ResponseEntity<List<ProblemResponse>> getWithPrototypes() {
        return ResponseEntity.ok(problemService.findWithPrototypes());
    }

    @GetMapping("/solved/me")
    public ResponseEntity<List<ProblemResponse>> getSolvedByMe() {
        return ResponseEntity.ok(problemService.findSolvedByFunder());
    }

    @GetMapping("/solved/team")
    public ResponseEntity<List<ProblemResponse>> getSolvedByTeam() {
        return ResponseEntity.ok(problemService.findSolvedByTeam());
    }

    @PostMapping("/{id}/mark-solved")
    @PreAuthorize("hasRole('GOVERNMENT') or hasRole('INDUSTRY_NGO') or hasRole('CITIZEN')")
    public ResponseEntity<ProblemResponse> markSolved(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.markSolved(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GOVERNMENT')")
    public ResponseEntity<MessageResponse> deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
        return ResponseEntity.ok(MessageResponse.of("Problem deleted successfully"));
    }
}