package com.crowdsolve.portal.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRequestResponse {
    private Long id;
    private Long problemId;
    private Long teamId;
    private Long industryId;
    private String initiatedBy;
    private String source;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private String contactEmail;
    private String contactPhone;
    private String contactName;
    private BigDecimal fundingAmount;
}