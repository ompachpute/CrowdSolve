package com.crowdsolve.portal.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundingResponse {
    private Long id;
    private Long problemId;
    private String problemTitle;
    private Long prototypeId;
    private Long funderId;
    private String fundingType;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
}