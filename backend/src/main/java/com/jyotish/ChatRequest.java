package com.jyotish;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ChatRequest(
        @NotBlank @Size(max = 24000) String chart,
        @NotEmpty @Size(max = 12) List<@NotNull @Valid Turn> messages) {
    public record Turn(@NotBlank @Pattern(regexp = "user|assistant") String role,
                       @NotBlank @Size(max = 2000) String content) {}
}
