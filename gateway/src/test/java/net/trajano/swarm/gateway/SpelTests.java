package net.trajano.swarm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import net.trajano.swarm.gateway.discovery.ratelimiter.RateLimiterConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.ApplicationContext;
import org.springframework.context.expression.BeanFactoryResolver;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

@SpringBootTest(classes = RateLimiterConfiguration.class)
class SpelTests {

  @Autowired private ApplicationContext applicationContext;

  @Autowired private BeanFactory beanFactory;

  @Autowired private KeyResolver tokenKeyResolver;

  @Test
  void keyResolver() {
    assertThat(applicationContext).isNotNull();
    assertThat(tokenKeyResolver).isNotNull();
    ExpressionParser parser = new SpelExpressionParser();

    final var evaluationContext = new StandardEvaluationContext();
    evaluationContext.setBeanResolver(new BeanFactoryResolver(beanFactory));

    Expression exp = parser.parseExpression("@tokenKeyResolver");
    var evaluated = exp.getValue(evaluationContext, KeyResolver.class);
    assertThat(evaluated).isNotNull().isEqualTo(tokenKeyResolver);
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

  @Test
  void sampleFromInternet() {
    ExpressionParser parser = new SpelExpressionParser();

    Expression exp = parser.parseExpression("'Hello World'.bytes.length");
    int length = (Integer) exp.getValue();
    assertThat(length).isEqualTo("Hello World".length());
  }

  static record Context(Map<String, Object> metadata) {}
}
