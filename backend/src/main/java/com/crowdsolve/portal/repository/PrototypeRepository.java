package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.Prototype;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrototypeRepository extends JpaRepository<Prototype, Long> {
    List<Prototype> findByProblemId(Long problemId);
    List<Prototype> findByTeamId(Long teamId);
    List<Prototype> findByStatus(String status);
}