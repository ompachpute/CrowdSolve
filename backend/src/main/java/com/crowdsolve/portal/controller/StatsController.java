package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(statsService.getDashboardStats());
    }
}