package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;

class SpelTests {

  @Test
  void sampleFromInternet() {
    ExpressionParser parser = new SpelExpressionParser();

    Expression exp = parser.parseExpression("'Hello World'.bytes.length");
    int length = (Integer) exp.getValue();
    assertThat(length).isEqualTo("Hello World".length());
  }

  @Test
  void metadata() {
    ExpressionParser parser = new SpelExpressionParser();

    var context = new Context(Map.of("protocol", "grpc"));
    Expression exp = parser.parseExpression("metadata['protocol']");
    var evaluated = exp.getValue(context, String.class);
    assertThat(evaluated).isEqualTo("grpc");
  }

  @Test
  void metadataDefault() {
    ExpressionParser parser = new SpelExpressionParser();

    var context = new Context(Map.of());
    Expression exp = parser.parseExpression("metadata['protocol'] ?: 'grpc'");
    var evaluated = exp.getValue(context, String.class);
    assertThat(evaluated).isEqualTo("grpc");
  }

  static record Context(Map<String, Object> metadata) {}
}
