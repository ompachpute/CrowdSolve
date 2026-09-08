package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.Funding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FundingRepository extends JpaRepository<Funding, Long> {
    List<Funding> findByFunderId(Long funderId);
    List<Funding> findByProblemId(Long problemId);
    List<Funding> findByPrototypeId(Long prototypeId);
}