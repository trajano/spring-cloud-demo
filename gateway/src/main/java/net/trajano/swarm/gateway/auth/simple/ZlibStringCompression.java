package net.trajano.swarm.gateway.auth.simple;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.InflaterOutputStream;
import org.apache.commons.io.input.ReaderInputStream;
import org.apache.commons.io.output.WriterOutputStream;

/** This is a simplistic implementation of using Zlib compression with strings. */
public class ZlibStringCompression {

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

  public static void decompress(InputStream source, OutputStream target) throws IOException {

    try (var out = new InflaterOutputStream(target);
        var in = new BufferedInputStream(source)) {
      int c = in.read();
      while (c != -1) {
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

  public static String decompressUtf8(byte[] input) {
    try (var sw = new StringWriter();
        var out = new WriterOutputStream(sw, StandardCharsets.UTF_8);
        var in = new ByteArrayInputStream(input)) {
      decompress(in, out);
      return sw.toString();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  public static String decompress(String input) {

    return decompressUtf8(Base64.getUrlDecoder().decode(input));
  }
}
