package net.trajano.swarm.gateway.auth.claims;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.InflaterOutputStream;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.io.input.ReaderInputStream;
import org.apache.commons.io.output.CountingOutputStream;
import org.apache.commons.io.output.WriterOutputStream;
import reactor.core.publisher.Mono;

/**
 * This is a simplistic implementation of using ZLib compression with strings. It is meant to be
 * used with a small strings and not meant for large streaming content.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ZLibStringCompression {

  /** 2 MB limit by default. */
  private static final int DEFAULT_LIMIT = 2 * 1024 * 1024;

  public static void compress(InputStream source, OutputStream target) throws IOException {

    try (var out = new DeflaterOutputStream(target, new Deflater(Deflater.BEST_COMPRESSION));
        var in = new BufferedInputStream(source)) {
      int c = in.read();
      while (c != -1) {
        out.write(c);
        c = in.read();
      }
      out.flush();
    }
  }

  public static void decompress(InputStream source, OutputStream target, int limit)
      throws IOException {

    try (var countingOutputStream = new CountingOutputStream(target);
        var out = new InflaterOutputStream(countingOutputStream);
        var in = new BufferedInputStream(source)) {
      int c = in.read();
      while (c != -1) {
        if (countingOutputStream.getByteCount() > limit) {
          throw new IOException("Decompressing past limit %d bytes".formatted(limit));
        }
        out.write(c);
        c = in.read();
      }
      out.flush();
    }
  }

  public static byte[] compressToBytes(String input) {

    try (var in = new ReaderInputStream(new StringReader(input), StandardCharsets.UTF_8);
        var out = new ByteArrayOutputStream()) {
      compress(in, out);
      return out.toByteArray();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  public static String compress(String input) {

    return Base64.getUrlEncoder().withoutPadding().encodeToString(compressToBytes(input));
  }

  /**
   * Decompresses to a string bounded by a limit.
   *
   * @param input compressed bytes
   * @param limit limit decompression amount in bytes (not characters)
   * @return decompressed string output.
   */
  public static String decompressUtf8(byte[] input, int limit) {
    try (var sw = new StringWriter();
        var out = new WriterOutputStream(sw, StandardCharsets.UTF_8);
        var in = new ByteArrayInputStream(input)) {
      decompress(in, out, limit);
      return sw.toString();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  public static String decompress(String input, int limit) {

    return decompressUtf8(Base64.getUrlDecoder().decode(input), limit);
  }

  public static String decompressIfNeeded(String input, int limit) {
    if (input.startsWith("eNo") || input.startsWith("eNp")) {
      return decompress(input, limit);
    } else {
      return input;
    }
  }

  public static Mono<String> decompressToMono(String input, int limit) {
    try {
      return Mono.just(decompressUtf8(Base64.getUrlDecoder().decode(input), limit));
    } catch (IllegalArgumentException e) {
      return Mono.error(e);
    }
  }
}
