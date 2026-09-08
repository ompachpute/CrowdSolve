package com.crowdsolve.portal.dto;

import com.crowdsolve.portal.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    private String name;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    @NotBlank
    @Size(min = 2, max = 50)
    private String role;

    private String phone;
    private String organization;
    private String location;
    private String[] skillTags;
    private String[] categoryInterests;
    private Integer capacity;

    public static User toEntity(RegisterRequest req, String passwordHash) {
        return User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordHash)
                .role(req.getRole())
                .phone(req.getPhone())
                .organization(req.getOrganization())
                .location(req.getLocation())
                .skillTags(req.getSkillTags())
                .categoryInterests(req.getCategoryInterests())
                .capacity(req.getCapacity() != null ? req.getCapacity() : 5)
                .build();
    }
}