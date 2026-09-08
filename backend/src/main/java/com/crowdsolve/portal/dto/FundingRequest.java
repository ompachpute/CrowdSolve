package com.crowdsolve.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundingRequest {
    @NotNull
    private Long problemId;

    @NotNull
    private Long prototypeId;

    @NotNull
    private Long funderId;
    @NotBlank
    private String fundingType;
    @NotNull
    private BigDecimal amount;
}