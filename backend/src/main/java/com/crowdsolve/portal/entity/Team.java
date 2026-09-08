package com.crowdsolve.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    @Column(name = "member_ids", columnDefinition = "bigint[] DEFAULT '{}'")
    private Long[] memberIds;

    @Column(columnDefinition = "text[] DEFAULT '{}'")
    private String[] skillTags;

    @Column(columnDefinition = "text[] DEFAULT '{}'")
    private String[] categoryInterests;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 5;

    @Column(name = "current_problems", nullable = false)
    @Builder.Default
    private Integer currentProblems = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}