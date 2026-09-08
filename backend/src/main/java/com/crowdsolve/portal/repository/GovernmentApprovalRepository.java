package com.crowdsolve.portal.repository;

import com.crowdsolve.portal.entity.GovernmentApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GovernmentApprovalRepository extends JpaRepository<GovernmentApproval, Long> {
    List<GovernmentApproval> findByStatus(String status);
    List<GovernmentApproval> findByApprovedById(Long approvedById);
}