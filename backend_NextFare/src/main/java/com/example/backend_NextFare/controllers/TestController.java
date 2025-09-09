package com.example.backend_NextFare.controllers;

import com.example.backend_NextFare.services.testServices.TestDTO;
import com.example.backend_NextFare.services.testServices.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping("/text")
    public String getTest() {
        return testService.getTestMessage().getBody();
    }

    @GetMapping("/get/{documentId}")
    public ResponseEntity<TestDTO> get(@PathVariable String documentId) throws Exception {
        return testService.get(documentId);
    }

    @PostMapping("/post")
    public ResponseEntity<String> create(@RequestBody TestDTO testDTO) throws Exception {
        return testService.create(testDTO);
    }

    @DeleteMapping("/delete/{documentId}")
    public ResponseEntity<String> delete(@PathVariable String documentId) throws Exception {
        return testService.delete(documentId);
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debug() throws Exception {
        return testService.debugConnection();
    }



}
