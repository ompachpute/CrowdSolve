package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.MessageResponse;
import com.crowdsolve.portal.dto.ProblemResponse;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.service.ProblemService;
import com.crowdsolve.portal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProblemService problemService;

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasRole('GOVERNMENT')")
    public ResponseEntity<MessageResponse> banUser(@PathVariable Long id) {
        userService.banUser(id);
        return ResponseEntity.ok(MessageResponse.of("User banned successfully"));
    }

    @GetMapping("/flagged")
    @PreAuthorize("hasRole('GOVERNMENT')")
    public ResponseEntity<List<ProblemResponse>> getFlagged() {
        return ResponseEntity.ok(problemService.findAll().stream()
                .filter(p -> "DUPLICATE_REJECTED".equals(p.getStatus()) || "SUBMITTED".equals(p.getStatus()))
                .toList());
    }
}