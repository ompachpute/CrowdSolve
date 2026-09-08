package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.DuplicateLink;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DuplicateLinkRepository extends JpaRepository<DuplicateLink, Long> {
}