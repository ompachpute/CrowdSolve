package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.MessageResponse;
import com.crowdsolve.portal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasRole('GOVERNMENT')")
    public ResponseEntity<MessageResponse> banUser(@PathVariable Long id) {
        userService.banUser(id);
        return ResponseEntity.ok(MessageResponse.of("User banned successfully"));
    }
}