package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.DuplicateLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DuplicateLinkRepository extends JpaRepository<DuplicateLink, Long> {

    /** Returns the IDs of all problems that have been flagged as duplicates. */
    @Query("SELECT DISTINCT dl.problem.id FROM DuplicateLink dl WHERE dl.problem IS NOT NULL")
    List<Long> findDuplicateProblemIds();
}