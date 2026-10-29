using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Speech.Synthesis;
using System.Web.Script.Serialization;
class SpeechHost {
  static int Main(string[] args) {
    Console.OutputEncoding = new UTF8Encoding(false);
    Console.InputEncoding = new UTF8Encoding(false);
    try {
      using (var synth = new SpeechSynthesizer()) {
        var json = new JavaScriptSerializer();
        if (args.Length == 1 && args[0] == "play") {
          string path = Console.In.ReadToEnd();
          using (var player = new System.Media.SoundPlayer(path)) player.PlaySync();
          Console.WriteLine("{\"ok\":true}");
          return 0;
        }
        if (args.Length == 1 && args[0] == "voices") {
          Console.WriteLine(json.Serialize(synth.GetInstalledVoices().Where(v => v.Enabled).Select(v => new { id=v.VoiceInfo.Name, name=v.VoiceInfo.Name, language=v.VoiceInfo.Culture.Name }).ToArray()));
          return 0;
        }
        if (args.Length != 1 || args[0] != "render") return 2;
        var request = json.Deserialize<System.Collections.Generic.Dictionary<string,object>>(Console.In.ReadToEnd());
        string voice = (string)request["voice"], text = (string)request["text"], output = (string)request["output"];
        if (text.Length > 2000) return 2;
        synth.SelectVoice(voice);
        synth.Rate = Math.Max(-4, Math.Min(4, Convert.ToInt32(request["rate"])));
        synth.SetOutputToWaveFile(output);
        synth.Speak(text);
        synth.SetOutputToNull();
        Console.WriteLine("{\"ok\":true}");
      }
      return 0;
    } catch (Exception error) { Console.Error.WriteLine(error.Message); return 1; }
  }
}
