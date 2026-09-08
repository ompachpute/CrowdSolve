package com.crowdsolve.portal.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrototypeResponse {
    private Long id;
    private Long problemId;
    private String problemTitle;
    private Long teamId;
    private String teamName;
    private String teamEmail;
    private Long industryId;
    private String industryName;
    private String industryEmail;
    private String description;
    private String fileUrl;
    private String repoLink;
    private String pptUrl;
    private String status;
    private String fundingStatus;
    private LocalDateTime createdAt;
}