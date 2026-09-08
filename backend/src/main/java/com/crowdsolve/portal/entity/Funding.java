package com.crowdsolve.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fundings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Funding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id")
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prototype_id")
    private Prototype prototype;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funder_id")
    private User funder;

    @Column(name = "funding_type", nullable = false, length = 50)
    private String fundingType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PLEDGED";

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}