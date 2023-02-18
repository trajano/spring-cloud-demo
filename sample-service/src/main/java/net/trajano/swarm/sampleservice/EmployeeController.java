package net.trajano.swarm.sampleservice;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

record Employee(String id, String name, String description) {}

@Component
@RestController
public class EmployeeController {

  private static final List<Employee> DB = new ArrayList<>();

  static {
    DB.add(new Employee("1", "Frodo", "ring bearer"));
    DB.add(new Employee("2", "Bilbo", "burglar"));
  }

  @GetMapping("/api/employees")
  Flux<Employee> all() {

    return Flux.fromIterable(DB);
  }

  @GetMapping("/api/employees/{id}")
  Mono<Employee> one(@PathVariable String id) {

    return Flux.fromIterable(DB).filter(employee -> employee.id().equals(id)).last();
  }
}
