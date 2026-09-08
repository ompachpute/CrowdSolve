package com.crowdsolve.portal.controller;

import com.crowdsolve.portal.dto.FundingResponse;
import com.crowdsolve.portal.service.FundingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fundings")
@RequiredArgsConstructor
public class FundingController {

    private final FundingService fundingService;

    @GetMapping("/me")
    public ResponseEntity<List<FundingResponse>> getMyFundings() {
        return ResponseEntity.ok(fundingService.findMine());
    }
}
