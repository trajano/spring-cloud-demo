package net.trajano.swarm.gateway.auth.clientmanagement;

public class InvalidClientException extends SecurityException {

  public InvalidClientException() {}

  public InvalidClientException(String s) {

    super(s);
  }

  public InvalidClientException(String message, Throwable cause) {

    super(message, cause);
  }

  public InvalidClientException(Throwable cause) {

    super(cause);
  }
}
