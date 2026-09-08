package com.crowdsolve.portal.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemResponse {
    private Long id;
    private Long reporterId;
    private String title;
    private String description;
    private String category;
    private String severity;
    private String photoUrl;
    private String videoUrl;
    private Double latitude;
    private Double longitude;
    private String address;
    private String status;
    private Boolean isFunded;
    private String fundedBy;
    private LocalDateTime createdAt;
    private List<PrototypeResponse> prototypes;
    private Boolean hasPrototypes;
}