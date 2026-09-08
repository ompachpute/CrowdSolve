package com.crowdsolve.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrototypeRequest {
    @NotNull
    private Long problemId;

    @NotNull
    private Long teamId;

    private Long industryId;
    @NotBlank
    private String description;
    private String fileUrl;
    private String repoLink;
    private String pptUrl;
}