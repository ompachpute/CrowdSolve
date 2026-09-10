package com.crowdsolve.portal.service;

import com.crowdsolve.portal.entity.Team;
import com.crowdsolve.portal.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;

    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    public List<Team> findMine() {
        return List.of();
    }
}