package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByReporterId(Long reporterId);
    List<Problem> findByStatusIn(List<String> statuses);
    List<Problem> findByStatus(String status);
    List<Problem> findByFundedBy(String fundedBy);
}