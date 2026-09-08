package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByLeaderId(Long leaderId);
}