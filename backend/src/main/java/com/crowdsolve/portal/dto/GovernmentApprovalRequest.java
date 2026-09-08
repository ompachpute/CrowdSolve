package com.crowdsolve.portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GovernmentApprovalRequest {
    @NotNull
    private Long prototypeId;
    @NotNull
    private Long approvedBy;
}