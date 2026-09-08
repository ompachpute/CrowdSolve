package com.crowdsolve.portal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(length = 50)
    private String phone;

    @Column(length = 255)
    private String organization;

    @Column(length = 255)
    private String location;

    @Column(columnDefinition = "text[]")
    private String[] skillTags;

    @Column(columnDefinition = "text[]")
    private String[] categoryInterests;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 5;

    @Column(nullable = false)
    @Builder.Default
    private Boolean banned = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}