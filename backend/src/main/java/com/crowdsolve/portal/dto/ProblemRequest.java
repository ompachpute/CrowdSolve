package com.crowdsolve.portal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private String category;
    private String severity;
    private String photoUrl;
    private String videoUrl;
    private Double latitude;
    private Double longitude;
    private String address;
}