package net.trajano.spring.swarm.client;

import com.github.dockerjava.api.command.DockerCmdSyncExec;
import com.github.dockerjava.api.command.SyncDockerCmd;

import java.util.List;
import java.util.Map;

public interface ListConfigsCmd extends SyncDockerCmd<List<Config>> {
    Map<String, List<String>> getFilters();

    /**
     * @param ids - Show only secrets with the given ids
     */
    ListConfigsCmd withIdFilter(List<String> ids);

    /**
     * @param names - Show only secrets with the given names
     */
    ListConfigsCmd withNameFilter(List<String> names);

    /**
     * @param labels - Show only secrets with the passed labels. Labels is a {@link Map} that contains label keys and values
     */
    ListConfigsCmd withLabelFilter(Map<String, String> labels);

    interface Exec extends DockerCmdSyncExec<ListConfigsCmd, List<Config>> {
    }

}
