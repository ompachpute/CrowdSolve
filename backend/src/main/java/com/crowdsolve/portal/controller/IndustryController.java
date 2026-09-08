package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.ProblemResponse;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/industries")
@RequiredArgsConstructor
public class IndustryController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('INDUSTRY_NGO') or hasRole('GOVERNMENT')")
    public ResponseEntity<List<User>> getIndustries() {
        return ResponseEntity.ok(userService.findAll().stream()
                .filter(u -> "INDUSTRY_NGO".equals(u.getRole()) || "GOVERNMENT".equals(u.getRole()))
                .toList());
    }
}