using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Threading;
using System.Collections.Generic;
public static class EneWindowHost {
  delegate bool Callback(IntPtr h, IntPtr p);
  [StructLayout(LayoutKind.Sequential)] struct Rect { public int Left,Top,Right,Bottom; }
  [DllImport("user32.dll")] static extern bool EnumWindows(Callback cb,IntPtr p);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out Rect r);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr c);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h,int a,out Rect r,int size);
  [DllImport("user32.dll")] static extern int GetWindowRgn(IntPtr h,IntPtr region);
  [DllImport("user32.dll")] static extern uint GetDpiForWindow(IntPtr h);
  [DllImport("gdi32.dll")] static extern IntPtr CreateRectRgn(int l,int t,int r,int b);
  [DllImport("gdi32.dll")] static extern int GetRgnBox(IntPtr region,out Rect r);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr h);
  static string Escape(string s) { var b=new StringBuilder("\""); foreach(char c in s) { if(c=='"' || c=='\\') { b.Append('\\'); b.Append(c); } else if(c<32) { b.Append("\\u"); b.Append(((int)c).ToString("x4")); } else b.Append(c); } return b.Append('"').ToString(); }
  static string State(IntPtr h, bool title, out uint pid) {
    pid=0;
    if(!IsWindow(h)||!IsWindowVisible(h)||IsIconic(h)) return "{\"visible\":false}";
    Rect r;
    if(DwmGetWindowAttribute(h,9,out r,16)!=0) GetWindowRect(h,out r);
    GetWindowThreadProcessId(h,out pid);
    var text="{\"visible\":true,\"handle\":"+Escape(h.ToInt64().ToString())+",\"pid\":"+pid+",\"x\":"+r.Left+",\"y\":"+r.Top+",\"width\":"+(r.Right-r.Left)+",\"height\":"+(r.Bottom-r.Top);
    if(title) { var s=new StringBuilder(512); GetWindowText(h,s,512); if(s.Length==0 || r.Right-r.Left<240 || r.Bottom-r.Top<120) return null; text+=",\"title\":"+Escape(s.ToString()); }
    return text+"}";
  }
  public static int Main(string[] args) {
    try {
      Console.OutputEncoding=new UTF8Encoding(false);
      SetProcessDpiAwarenessContext(new IntPtr(-4));
      if(args.Length<2) return 2;
      if(args[0]=="list") {
        uint owner=uint.Parse(args[1]); var entries=new List<string>();
        EnumWindows(delegate(IntPtr h,IntPtr p) { uint pid; var s=State(h,true,out pid); if(s!=null && pid!=0 && pid!=owner) entries.Add(s); return true; },IntPtr.Zero);
        Console.WriteLine("["+string.Join(",",entries.ToArray())+"]");
      } else if(args[0]=="region") {
        var h=new IntPtr(long.Parse(args[1])); var region=CreateRectRgn(0,0,0,0); Rect r;
        int kind=GetWindowRgn(h,region); GetRgnBox(region,out r);
        Console.WriteLine("{\"kind\":"+kind+",\"dpi\":"+GetDpiForWindow(h)+",\"left\":"+r.Left+",\"top\":"+r.Top+",\"right\":"+r.Right+",\"bottom\":"+r.Bottom+"}"); DeleteObject(region);
      } else if(args[0]=="follow") {
        var h=new IntPtr(long.Parse(args[1])); string previous=null;
        while(true) { uint pid; string s=State(h,false,out pid); if(s!=previous) { Console.WriteLine(s); previous=s; } if(pid==0) break; Thread.Sleep(120); }
      } else return 2;
      return 0;
    } catch(Exception e) { Console.Error.WriteLine(e.Message); return 1; }
  }
}
