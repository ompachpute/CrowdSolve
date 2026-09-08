package com.crowdsolve.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRequestRequest {
    @NotNull
    private Long problemId;

    @NotNull
    private Long teamId;

    private Long industryId;
    @NotBlank
    private String initiatedBy;
    @NotBlank
    private String source;
    private String notes;
    private BigDecimal fundingAmount;
}