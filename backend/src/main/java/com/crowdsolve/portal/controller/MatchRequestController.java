package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.MatchRequestRequest;
import com.crowdsolve.portal.dto.MatchRequestResponse;
import com.crowdsolve.portal.service.MatchRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class MatchRequestController {

    private final MatchRequestService matchRequestService;

    @PostMapping
    public ResponseEntity<MatchRequestResponse> create(@Valid @RequestBody MatchRequestRequest request) {
        return ResponseEntity.ok(matchRequestService.create(request));
    }

    @GetMapping("/team")
    public ResponseEntity<List<MatchRequestResponse>> getTeamRequests() {
        return ResponseEntity.ok(matchRequestService.findTeamRequests());
    }

    @GetMapping("/industry")
    public ResponseEntity<List<MatchRequestResponse>> getIndustryRequests() {
        return ResponseEntity.ok(matchRequestService.findIndustryRequests());
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<MatchRequestResponse> accept(@PathVariable Long id) {
        return ResponseEntity.ok(matchRequestService.accept(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<MatchRequestResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(matchRequestService.reject(id));
    }
}