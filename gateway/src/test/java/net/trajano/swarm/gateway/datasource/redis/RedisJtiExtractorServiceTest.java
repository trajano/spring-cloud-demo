package net.trajano.swarm.gateway.datasource.redis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class RedisJtiExtractorServiceTest {

  @Test
  void extractJtiWithoutValidation() {
    var jwtId =
        RedisJtiExtractorService.extractJtiWithoutValidation(
            "DPiF.eyJqdGkiOiJmY2U5MTEzZi02NjQyLTQ5MDQtODEwMy1jNTdhNzg1ZDU1OWIiLCJleHAiOjE2NjIyNjUxODh9.YQpsZgeCAXnEEcxhJnAlGrujcJtflwvntGu9i6WkbN0uUTb3mwRZaeeIAEoo3kydCh4Rk3BtI8epXmYvNJMEi3S7kks6j9VFx5I26zggGm4qlqHIkYAhHxOKIfnAomxfskhOrtMrCSL-4NI7ejJFilNVjO1sGQyxjHO24Wv4dhSYeLyqtSiyukZUgQC98TVfstviQX6n-j2f2gOoV_ZDDgkUSAd2zOqlIuOFdS79OSLRF0Dfn-qmag8jlkgLfBF0v_uhn72MvXWisIsmF66VYy_18x-ZvCQsusgHKjsnQ1JWyctDMnTQMwxXGOTnF1uWjARf1_5oCZWE6YsoZLVDiA");
    assertThat(jwtId).hasToString("fce9113f-6642-4904-8103-c57a785d559b");
  }
}
