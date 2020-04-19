package net.trajano.spring.cloudgateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
//@EnableDiscoveryClient
public class App {
//    @Autowired
//    private DiscoveryClient client;
//
//    @Autowired
//    private DockerSwarmDiscoveryClient dockerSwarmDiscoveryClient;
//
//    @PostConstruct
//    public void foo() {
//        System.out.println(client);
//        System.out.println(client.getServices());
//        System.out.println(dockerSwarmDiscoveryClient.getServices());
//    }
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
