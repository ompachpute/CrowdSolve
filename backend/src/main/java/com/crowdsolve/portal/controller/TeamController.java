package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.entity.Team;
import com.crowdsolve.portal.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<List<Team>> getAll() {
        return ResponseEntity.ok(teamService.findAll());
    }

    @GetMapping("/me")
    public ResponseEntity<List<Team>> getMine() {
        return ResponseEntity.ok(teamService.findMine());
    }
}