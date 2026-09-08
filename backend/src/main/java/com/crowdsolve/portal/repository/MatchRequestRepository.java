package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.MatchRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, Long> {
    List<MatchRequest> findByTeamId(Long teamId);
    List<MatchRequest> findByIndustryId(Long industryId);
    List<MatchRequest> findByStatus(String status);
}