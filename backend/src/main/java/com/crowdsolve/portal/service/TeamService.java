package com.crowdsolve.portal.service;

import com.crowdsolve.portal.entity.Team;
import com.crowdsolve.portal.entity.User;
import com.crowdsolve.portal.repository.TeamRepository;
import com.crowdsolve.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

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

    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    public List<Team> findMine() {
        Long userId = currentUser().getId();
        return teamRepository.findByLeaderId(userId);
    }

    public Team create(Team team) {
        if (team.getCapacity() == null) {
            team.setCapacity(5);
        }
        if (team.getCurrentProblems() == null) {
            team.setCurrentProblems(0);
        }
        return teamRepository.save(team);
    }

    public Team join(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        if (team.getCurrentProblems() >= team.getCapacity()) {
            throw new RuntimeException("Team is at full capacity");
        }
        List<Long> members = List.of(team.getMemberIds() != null ? team.getMemberIds() : new Long[0]);
        if (!members.contains(userId)) {
            List<Long> updated = new java.util.ArrayList<>(members);
            updated.add(userId);
            team.setMemberIds(updated.toArray(new Long[0]));
        }
        return teamRepository.save(team);
    }
}