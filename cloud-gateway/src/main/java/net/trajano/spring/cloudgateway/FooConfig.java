package net.trajano.spring.cloudgateway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.discovery.event.InstanceRegisteredEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
//@EnableScheduling
public class FooConfig implements ApplicationListener<InstanceRegisteredEvent> {
    @Autowired
    private ApplicationEventPublisher publisher;

    @Override
    public void onApplicationEvent(InstanceRegisteredEvent event) {
        System.out.println("EEEEEE" + event);
    }

//    @Scheduled(fixedDelay = 10000)
//    public void test() {
//        System.out.println("SCHEDULE to " + publisher);
//        publisher.publishEvent(new InstanceRegisteredEvent<>(this, "HELLO"));
//    }

}
