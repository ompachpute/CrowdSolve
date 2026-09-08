package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.PrototypeRequest;
import com.crowdsolve.portal.dto.PrototypeResponse;
import com.crowdsolve.portal.service.PrototypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prototypes")
@RequiredArgsConstructor
public class PrototypeController {

    private final PrototypeService prototypeService;

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrototypeResponse> create(
            @RequestParam(required = false) Long problemId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) Long industryId,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String fileUrl,
            @RequestParam(required = false) String repoLink,
            @RequestParam(required = false) String pptUrl) {
        PrototypeRequest request = PrototypeRequest.builder()
                .problemId(problemId)
                .teamId(teamId)
                .industryId(industryId)
                .description(description)
                .fileUrl(fileUrl)
                .repoLink(repoLink)
                .pptUrl(pptUrl)
                .build();
        return ResponseEntity.ok(prototypeService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<PrototypeResponse>> getAll() {
        return ResponseEntity.ok(prototypeService.findAll());
    }

    @GetMapping("/team")
    public ResponseEntity<List<PrototypeResponse>> getMine() {
        return ResponseEntity.ok(prototypeService.findMine());
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<PrototypeResponse>> getByProblem(@PathVariable Long problemId) {
        return ResponseEntity.ok(prototypeService.findByProblem(problemId));
    }

    @PostMapping("/{id}/fund")
    @PreAuthorize("hasRole('INDUSTRY_NGO') or hasRole('GOVERNMENT')")
    public ResponseEntity<PrototypeResponse> fund(@PathVariable Long id) {
        return ResponseEntity.ok(prototypeService.fund(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('GOVERNMENT')")
    public ResponseEntity<PrototypeResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(prototypeService.approve(id));
    }
}