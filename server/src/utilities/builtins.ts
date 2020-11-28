// builtin_variable and its docs
export const builtin_variable = [
    ["A_Space", "此变量包含单个空格字符. 请参阅AutoTrim了解详情."],
    ["A_Tab", "此变量包含单个 tab 字符. 请参阅AutoTrim了解详情."],
    ["A_Args", "[v1.1.27+] 读/写: 包含一个命令行参数数组. 有关详细信息, 请参阅向脚本传递命令行参数."],
    ["A_WorkingDir", "脚本当前工作目录, 这是脚本访问文件的默认路径. 除非是根目录, 否则路径末尾不包含反斜杠. 两个示例: C:\\ 和 C:\\My Documents. 使用 SetWorkingDir 可以改变当前工作目录."],
    ["A_ScriptDir", "当前脚本所在目录的绝对路径. 不包含最后的反斜杠(根目录同样如此)."],
    ["A_ScriptName", "当前脚本的文件名称, 不含路径, 例如 MyScript.ahk."],
    ["A_ScriptFullPath", "上面两个变量的组合, 包含了当前脚本的完整路径和名称, 例如 C:\\My Documents\\My Script.ahk"],
    ["A_ScriptHwnd", "[v1.1.01+] 脚本的隐藏主窗口的唯一 ID(HWND/句柄)."],
    ["A_LineNumber", "当前脚本中正在执行的行所在的行号(或其 #Include 文件的行号). 这个行号与 ListLines 显示的一致; 它可以用在报告错误的时候, 例如: MsgBox Could not write to log file (line number %A_LineNumber%).由于已编译脚本已经把它所有的 #Include 文件合并成一个大脚本, 所以它的行号可能与它在未编译模式运行时不一样."],
    ["A_LineFile", "A_LineNumber 所属文件的完整路径和名称, 除非当前行属于未编译脚本的某个 #Include 文件, 否则它将和 A_ScriptFullPath 相同."],
    ["A_ThisFunc", "[v1.0.46.16+] 当前正在执行的自定义函数的名称(没有则为空); 例如: MyFunction. 另请参阅: IsFunc()"],
    ["A_ThisLabel", "[v1.0.46.16+] 当前正在执行的标签(子程序) 的名称(没有则为空); 例如: MyLabel. 每当脚本执行 Gosub/Return 或 Goto 时会更新此变量的值. 执行自动调用的标签时也会更新此变量的值, 例如计时器, GUI 线程, 菜单项, 热键, 热字串, OnClipboardChange 和 OnExit. 不过, 当执行从前面的语句\"进入\"一个标签时不会更新 A_ThisLabel 的值, 即此时它还是保持原来的值. 另请参阅: A_ThisHotkey 和 IsLabel()"],
    ["A_AhkVersion", "在 [1.0.22] 之前的版本, 此变量为空. 否则, 它包含了运行当前脚本的 AutoHotkey 主程序的版本号, 例如 1.0.22. 在已编译脚本中, 它包含了原来编译时使用的主程序的版本号. 格式化的版本号使得脚本可以使用 > 或 >= 来检查 A_AhkVersion 是否大于某个最小的版本号, 例如: if A_AhkVersion >= 1.0.25.07."],
    ["A_AhkPath", "对于未编译脚本: 实际运行当前脚本的 EXE 文件的完整路径和名称. 例如: C:\\Program Files\\AutoHotkey\\AutoHotkey.exe. 对于已编译脚本: 除了通过注册表条目 HKLM\\SOFTWARE\\AutoHotkey\\InstallDir 获取 AutoHotkey 目录外, 其他的和上面相同. 如果找不到这个注册表条目, 则 A_AhkPath 为空."],
    ["A_IsUnicode", "当字符串为 Unicode(16 位) 时值为 1, 字符串为 ANSI(8 位) 时为空字符串(这会被视为 false). 字符串的格式取决于用来运行当前脚本的 AutoHotkey.exe, 如果为已编译脚本, 则取决于用来编译它的主程序."],
    ["A_IsCompiled", "如果当前运行的脚本为已编译 EXE 时此变量值为 1, 否则为空字符串(这会被视为 false)."],
    ["A_ExitReason", "最近一次要求脚本终止的原因. 除非脚本含有 OnExit 子程序并且此子程序当前正在运行或被退出尝试至少调用过一次, 否则此变量为空. 请参阅 OnExit 了解详情."],
    ["A_YYYY", "4 位数表示的当前年份(例如 2004). 与 A_Year 含义相同. 注意: 要获取符合您区域设置和语言的格式化时间或日期, 请使用 FormatTime, OutputVar(时间和长日期) 或 FormatTime, OutputVar,, LongDate(获取长格式日期)."],
    ["A_MM", "2 位数表示的当前月份(01-12). 与 A_Mon 含义相同."],
    ["A_DD", "2 位数表示的当前月份的日期(01-31). 与 A_MDay 含义相同."],
    ["A_MMMM", "使用当前用户语言表示的当前月份的全称, 例如 July"],
    ["A_MMM", "使用当前用户语言表示的当前月份的简称, 例如 Jul"],
    ["A_DDDD", "使用当前用户语言表示的当前星期几的全称, 例如 Sunday"],
    ["A_DDD", "使用当前用户语言表示的当前星期几的简称, 例如 Sun"],
    ["A_WDay", "1 位数表示的当前星期经过的天数(1-7). 在所有区域设置中 1 都表示星期天."],
    ["A_YDay", "当前年份中经过的天数(1-366). 不会使用零对变量的值进行填充, 例如会获取到 9, 而不是 009. 要对变量的值进行零填充, 请使用: FormatTime, OutputVar, , YDay0."],
    ["A_YWeek", "符合 ISO 8601 标准的当前的年份和周数(例如 200453). 要分离年份和周数, 请使用 StringLeft, Year, A_YWeek, 4 和 StringRight, Week, A_YWeek, 2. A_YWeek 的准确定义为: 如果含有 1 月 1 日的星期有四天以上在新年里, 则它被认为是新年的第一个星期. 否则, 它为前一年的最后一个星期, 而下一星期为新年的第一星期."],
    ["A_Hour", "在 24 小时制(例如, 17 表示 5pm) 中 2 位数表示的当前小时数(00-23). 要获取带 AM/PM 提示的 12 小时制的时间, 请参照此例: FormatTime, OutputVar, , h:mm:ss tt"],
    ["A_Min", "2 位数表示的当前分钟数(00-59)."],
    ["A_Sec", "2 位数表示的当前秒数(00-59)."],
    ["A_MSec", "3 位数表示的当前毫秒数(000-999). 要移除前导零, 请参照此例: Milliseconds := A_MSec + 0."],
    ["A_Now", "YYYYMMDDHH24MISS 格式的当前本地时间.注意: 使用 EnvAdd 和 EnvSub 可以对日期和时间进行计算. 此外, 使用 FormatTime 可以根据您的区域设置或选项来格式化日期和/或时间."],
    ["A_NowUTC", "YYYYMMDDHH24MISS 格式的当前的协调世界时(UTC). UTC 本质上和格林威治标准时间(GMT) 一致."],
    ["A_TickCount", "计算机重启后经过的毫秒数. 通过把 A_TickCount 保存到变量中, 经过一段时间后从最近的 A_TickCount 值中减去那个变量, 可以计算出所经过的时间. 例如:StartTime := A_TickCount  \n Sleep, 1000  \n ElapsedTime := A_TickCount - StartTime  \n MsgBox, %ElapsedTime% milliseconds have elapsed.  \n 如果您需要比 A_TickCount 的 10ms 更高的精确度, 请使用 QueryPerformanceCounter()(高精度计时器)."],
    ["A_IsSuspended", "当脚本挂起时值为 1, 否则为 0."],
    ["A_IsPaused", "[v1.0.48+] 当紧随当前线程的线程被暂停时值为 1. 否则为 0."],
    ["A_IsCritical", "[v1.0.48+] 当前线程的 Critical 设置关闭时值为 0. 否则它包含大于零的整数, 即 Critical 使用的消息检查频率. 因为 Critical 0 关闭了当前线程的关键性, 所以 Critical 的当前状态可以这样来保存和恢复: Old_IsCritical := A_IsCritical, 后来执行 Critical %Old_IsCritical%."],
    ["A_BatchLines", "(同义于 A_NumBatchLines) 由 SetBatchLines 设置的当前值. 例如: 200 或 10ms(取决于格式)."],
    ["A_ListLines", "[v1.1.28+] ListLines 激活时值为 1. 否则为 0."],
    ["A_TitleMatchMode", "由 SetTitleMatchMode 设置的当前模式: 1, 2, 3 或 RegEx."],
    ["A_TitleMatchModeSpeed", "由 SetTitleMatchMode 设置的当前匹配速度(fast 或 slow)."],
    ["A_DetectHiddenWindows", "由 DetectHiddenWindows 设置的当前模式(On 或 Off)."],
    ["A_DetectHiddenText", "由 DetectHiddenText 设置的当前模式(On 或 Off)."],
    ["A_AutoTrim", "由 AutoTrim 设置的当前模式(On 或 Off)."],
    ["A_StringCaseSense", "由 StringCaseSense 设置的当前模式(On, Off 或 Locale)."],
    ["A_FileEncoding", "[v1.0.90+]: 包含了多个命令使用的默认编码; 请参阅 FileEncoding."],
    ["A_FormatInteger", "由 SetFormat 设置的当前整数格式(H 或 D). [v1.0.90+]: 此变量还可能为小写字母 h."],
    ["A_FormatFloat", "由 SetFormat 设置的当前浮点数格式."],
    ["A_SendMode", "[v1.1.23+]: 由 SendMode 设置的当前模式字符串(可能的值为: Event, Input, Play 或 InputThenPlay)."],
    ["A_SendLevel", "[v1.1.23+]: 当前 SendLevel 的设置(可能的值为: 0 到 100 之间的整数, 包括 0 和 100)."],
    ["A_StoreCapsLockMode", "[v1.1.23+]: 由 SetStoreCapsLockMode 设置的当前模式字符串(可能的值为: On 或 Off)."],
    ["A_KeyDelay", "由 SetKeyDelay 设置的当前延迟(总是十进制数, 不是十六进制). A_KeyDuration 依赖 [v1.1.23+] ."],
    ["A_KeyDuration", "由 SetKeyDelay 设置的当前延迟(总是十进制数, 不是十六进制). A_KeyDuration 依赖 [v1.1.23+] ."],
    ["A_KeyDelayPlay", "表示由 SetKeyDelay 设置 SendPlay 模式的延迟或持续时间(总是十进制数, 不是十六进制). 依赖 [v1.1.23+]. "],
    ["A_KeyDurationPlay", "表示由 SetKeyDelay 设置 SendPlay 模式的延迟或持续时间(总是十进制数, 不是十六进制). 依赖 [v1.1.23+]."],
    ["A_WinDelay", "由 SetWinDelay 设置的当前延迟(总是十进制数, 不是十六进制)."],
    ["A_ControlDelay", "由 SetControlDelay 设置的当前延迟(总是十进制数, 不是十六进制)."],
    ["A_MouseDelay", "由 SetMouseDelay 设置的当前延迟(总是十进制数, 不是十六进制). A_MouseDelay 表示传统的 SendEvent 模式. "],
    ["A_MouseDelayPlay", "由 SetMouseDelay 设置的当前延迟(总是十进制数, 不是十六进制). A_MouseDelayPlay 表示 SendPlay. A_MouseDelayPlay 依赖 [v1.1.23+]."],
    ["A_DefaultMouseSpeed", "由 SetDefaultMouseSpeed 设置的当前速度(总是十进制数, 不是十六进制)."],
    ["A_CoordModeToolTip", "[v1.1.23+]: CoordMode 的当前设置值的字符串. (可能的值为: Window, Client 或 Screen)"],
    ["A_CoordModePixel", "[v1.1.23+]: CoordMode 的当前设置值的字符串. (可能的值为: Window, Client 或 Screen)"],
    ["A_CoordModeMouse", "[v1.1.23+]: CoordMode 的当前设置值的字符串. (可能的值为: Window, Client 或 Screen)"],
    ["A_CoordModeCaret", "[v1.1.23+]: CoordMode 的当前设置值的字符串. (可能的值为: Window, Client 或 Screen) "],
    ["A_CoordModeMenu", "[v1.1.23+]: CoordMode 的当前设置值的字符串. (可能的值为: Window, Client 或 Screen)"],
    ["A_RegView", "[v1.1.08+]: 由 SetRegView 设置的当前注册表视图."],
    ["A_IconHidden", "托盘图标当前隐藏时值为 1, 否则为 0. 此图标可以使用 #NoTrayIcon 或 Menu 命令进行隐藏."],
    ["A_IconTip", "如果使用 Menu, Tray, Tip 为托盘图标指定了自定义的工具提示时, 变量的值为这个提示的文本, 否则为空."],
    ["A_IconFile", "如果使用 Menu, tray, icon 指定了自定义的托盘图标时, 变量的值为图标文件的完整路径和名称, 否则为空."],
    ["A_IconNumber", "当 A_IconFile 为空时此变量为空. 否则, 它的值为 A_IconFile 中的图标编号(通常为 1).用户空闲时间"],
    ["A_TimeIdle", "从系统最后一次接收到键盘, 鼠标或其他输入后所经过的毫秒数. 这可以用来判断用户是否离开. 用户的物理输入和由 任何 程序或脚本生成的模拟输入(例如 Send 或 MouseMove 命令)会让此变量重置为零. 由于此变量的值趋向于以 10 的增量增加, 所以不应该判断它是否等于另一个值. 相反, 应该检查此变量是否大于或小于另一个值. 例如: IfGreater, A_TimeIdle, 600000, MsgBox, The last keyboard or mouse activity was at least 10 minutes ago."],
    ["A_TimeIdlePhysical", "与上面类似, 但在安装了相应的钩子(键盘或鼠标) 后会忽略模拟的键击和/或鼠标点击; 即此变量仅反应物理事件. (这样避免了由于模拟键击和鼠标点击而误以为用户存在.) 如果两种钩子都没有安装, 则此变量等同于 A_TimeIdle. 如果仅安装了一种钩子, 那么仅此类型的物理输入才会对 A_TimeIdlePhysical 起作用(另一种/未安装钩子的输入, 包括物理的和模拟的, 都会被忽略)."],
    ["A_TimeIdleKeyboard", "[v1.1.28+] 如果安装了键盘钩子, 这是自系统上次接收物理键盘输入以来所经过的毫秒数. 否则, 这个变量就等于 A_TimeIdle."],
    ["A_TimeIdleMouse", "[v1.1.28+] 如果安装了鼠标钩子, 这是自系统上次收到物理鼠标输入以来所经过的毫秒数. 否则, 这个变量就等于 A_TimeIdle."],
    ["A_DefaultGui", "[v1.1.23+] 当前线程的 GUI 名称或序号."],
    ["A_DefaultListView", "[v1.1.23+] ListView 控件的变量名或句柄, 这取决与使用了何种 ListView 函数. 如果默认 GUI 中没有 ListView 控件, 此变量为空."],
    ["A_DefaultTreeView", "[v1.1.23+] TreeView 控件的变量名或句柄, 这取决与使用了何种 TreeView 函数. 如果默认 GUI 中没有 TreeView 控件, 此变量为空."],
    ["A_Gui", "启动了当前线程的 GUI 的名称或编号. 除非当前线程是由 Gui 控件, 菜单项或 Gui 事件(例如 GuiClose/GuiEscape) 启动的, 否则此变量为空."],
    ["A_GuiControl", "启动当前线程的 GUI 控件的关联变量名. 如果那个控件没有关联变量, 则 A_GuiControl 包含此控件的文本/标题中前 63 个字符(这常用来避免给每个按钮分配变量名). 出现后面这些情况时 A_GuiControl 为空: 1) A_Gui 为空; 2) GUI 菜单项或事件(例如 GuiClose/GuiEscape) 启动了当前线程; 3) 那个控件没有关联变量, 也没有标题; 或 4) 最初启动当前线程的控件已经不存在(可能由于 Gui Destroy 的原因)."],
    ["A_GuiWidth", "在 GuiSize 子程序中引用时, 它们分别包含了 GUI 窗口的宽度和高度. 它们对应于窗口的工作区, 这是窗口中不包括标题栏, 菜单栏和边框的区域. [v1.1.11+]: 这些值会受 DPI 缩放的影响."],
    ["A_GuiHeight", "在 GuiSize 子程序中引用时, 它们分别包含了 GUI 窗口的宽度和高度. 它们对应于窗口的工作区, 这是窗口中不包括标题栏, 菜单栏和边框的区域. [v1.1.11+]: 这些值会受 DPI 缩放的影响."],
    ["A_GuiX", "它们包含了 GuiContextMenu 和 GuiDropFiles 事件中的 X 坐标. 这里的坐标相对于窗口的左上角. [v1.1.11+]: 这些值会受 DPI 缩放的影响."],
    ["A_GuiY", "它们包含了 GuiContextMenu 和 GuiDropFiles 事件中的 Y 坐标. 这里的坐标相对于窗口的左上角. [v1.1.11+]: 这些值会受 DPI 缩放的影响."],
    ["A_GuiEvent", "启动当前线程的事件类型. 如果当前线程不是由 GUI 动作启动的, 则此变量为空. 否则, 它为下列字符串的其中一个:"],
    ["A_GuiControlEvent", "启动当前线程的事件类型. 如果当前线程不是由 GUI 动作启动的, 则此变量为空. 否则, 它为下列字符串的其中一个: Normal: 此事件是由左键单击和键击(↑, →, ↓, ←, Tab, Space, 带下划线的快捷键等) 触发的. 此变量的值还可以用于菜单项和特殊的 Gui 事件, 例如 GuiClose 和 GuiEscape. DoubleClick: 此事件是由双击触发的. 注意: 双击中的首次点击仍会引起 Normal 事件首先被接收到. 换句话说, 双击时子程序会运行两次: 一次在首次点击时, 再次是在第二次点击时. RightClick: 仅出现在 GuiContextMenu, ListViews 和 TreeViews."],
    ["A_EventInfo", "包含下列事件的额外信息:OnClipboardChange 标签   \n 鼠标滚轮热键(WheelDown/Up/Left/Right)  \n OnMessage()  \n RegisterCallback()  \n Regular Expression Callouts  \n GUI 事件, 即 GuiContextMenu, GuiDropFiles, ListBox, ListView, TreeView 和 StatusBar. 如果一个事件没有额外的信息, 那么 A_EventInfo 的值为 0.注意: 与类似 A_ThisHotkey 这样的变量不同, 每个线程会为 A_Gui, A_GuiControl, A_GuiX/Y, A_GuiEvent 和 A_EventInfo 保存它自己本身的值. 因此, 如果一个线程被另一个中断, 在这个线程恢复时它仍将看到这些变量的原来/正确的值."],
    ["A_ThisMenuItem", "最近选择的自定义菜单项的名称(没有则为空)."],
    ["A_ThisMenu", "A_ThisMenuItem 所在菜单的名称."],
    ["A_ThisMenuItemPos", "表示 A_ThisMenuItem 在 A_ThisMenu 当前 位置的编号. 菜单中首个项目为 1, 第二项为 2, 依此类推. 菜单分隔线也计算在内. 如果 A_ThisMenuItem 为空或已不存在于 A_ThisMenu 中, 则此变量为空. 如果 A_ThisMenu 已不存在, 则此变量也为空."],
    ["A_ThisHotkey", "最近执行的热键或非自动替换热字串的按键名称(如果没有则为空), 例如 #z. 如果当前线程被其他热键中断, 那么此变量的值会变化, 所以如果之后需要在子程序中使用原来的值, 则必须马上把它复制到另一个变量中.  \n 首次创建热键时(通过 Hotkey 命令或双冒号标签), 其键名以及修饰符的顺序成为此热键的固定名称, 被所有热键 variants 变量共享. 另请参阅: A_ThisLabel"],
    ["A_PriorHotkey", "除了保存前一次热键的名称外, 其他的与上面相同. 如果没有它会为空."],
    ["A_PriorKey", "[v1.1.01+]: 在最近按键按下或按键释放前最后按下的按键名称, 如果在按键历史中没有适用的按键按下则为空. 不包括由 AutoHotkey 脚本生成的所有输入. 要使用此变量, 首先必须安装键盘钩子或鼠标钩子同时启用按键历史."],
    ["A_TimeSinceThisHotkey", "从 A_ThisHotkey 按下后到现在经过的毫秒数. 如果 A_ThisHotkey 为空, 则此变量的值为 -1."],
    ["A_TimeSincePriorHotkey", "从 A_PriorHotkey 按下后到现在经过的毫秒数. 如果 A_PriorHotkey 为空, 则此变量的值为 -1."],
    ["A_EndChar", "用户最近按下的触发了非自动替换热字串的终止符. 如果不需要终止符(由于使用了 * 选项), 那么此变量将为空."],
    ["ComSpec", "[v1.0.43.08+] 此变量的值与系统环境变量 ComSpec 一样(例如 C:\\Windows\\system32\\cmd.exe). 常与 Run/RunWait 一起使用."],
    ["A_ComSpec", "[v1.1.28+] 此变量的值与系统环境变量 ComSpec 一样(例如 C:\\Windows\\system32\\cmd.exe). 常与 Run/RunWait 一起使用."],
    ["A_Temp", "[v1.0.43.09+] 存放临时文件的文件夹的完整路径和名称(例如 C:\\DOCUME~1\\<UserName>\\LOCALS~1\\Temp). 它的值从下列的其中一个位置获取(按顺序): 1) 环境变量 TMP, TEMP 或 USERPROFILE; 2) Windows 目录."],
    ["A_OSType", "正在运行的操作系统类型. 由于 AutoHotkey 1.1 仅支持基于 NT 的操作系统, 所以此变量总是为 WIN32_NT. 旧版本的 AutoHotkey 运行在 Windows 95/98/ME 时会返回 WIN32_WINDOWS."],
    ["A_OSVersion", "下列字符串中的一个(如果存在): WIN_7 [需要 v1.0.90+], WIN_8 [需要 v1.1.08+], WIN_8.1 [需要 v1.1.15+], WIN_VISTA, WIN_2003, WIN_XP, WIN_2000.  \n 在 AutoHotKey 的执行文件或编译后的脚本属性里添加兼容性设置会让操作系统报告不同的版本信息, 可以间接得出 A_OSVersion . [v1.1.20+]: 如果系统版本没有被识别成上述版本, 会返回一个\"major.minor.build\"形式的字符串. 例如, 10.0.14393 为 Windows 10 build 14393, 也称为 1607 版.  \n ; 这个示例已过时了, 里面的这些操作系统都不再受支持.  \n if A_OSVersion in WIN_NT4,WIN_95,WIN_98,WIN_ME  ; 注: 逗号两边没有空格.  \n {  \n    MsgBox This script requires Windows 2000/XP or later.  \n    ExitApp  \n }"],
    ["A_Is64bitOS", "[v1.1.08+]: 当操作系统为 64 位则值为 1(真), 为 32 位则为 0(假)."],
    ["A_PtrSize", "[v1.0.90+]: 包含指针的大小值, 单位为字节. 值为 4(32 位) 或 8(64 位), 取决于运行当前脚本的执行程序的类型."],
    ["A_Language", "当前系统的默认语言, 值为这些 4 位数字编码的其中一个."],
    ["A_ComputerName", "在网络上看到的计算机名称."],
    ["A_UserName", "运行当前脚本的用户的登录名."],
    ["A_WinDir", "Windows 目录. 例如: C:\\Windows"],
    ["A_ProgramFiles", "Program Files 目录(例如 C:\\Program Files 或者 C:\\Program Files (x86)). 一般来说和 ProgramFiles 环境变量一样."],
    ["ProgramFiles", "**(不建议使用，使用同义的A_ProgramFiles)**  \nProgram Files 目录(例如 C:\\Program Files 或者 C:\\Program Files (x86)). 一般来说和 ProgramFiles 环境变量一样.  \n 在 64 位系统(非 32 位系统) 上适用:  \n 如果可执行文件(EXE) 以 32 位脚本运行的时候, A_ProgramFiles 返回路径为 \"Program Files (x86)\" 目录.  \n 对于 32 位的进程, 这个 ProgramW6432 环境变量指向 64 位 Program Files 目录. 在 Windows 7 和更高版本上, 对于 64 位的进程也是这样设置的.  \n 而 ProgramFiles(x86) 环境变量指向 32 位 Program Files 目录.  \n [1.0.43.08+]: 前缀 A_ 可以省略, 这样有助于自然过渡到 #NoEnv."],
    ["A_AppData", "[v1.0.43.09+] 当前用户的应用程序数据文件夹的完整路径和名称. 例如: C:\\Documents and Settings\\Username\\Application Data"],
    ["A_AppDataCommon", "[v1.0.43.09+] 所有用户的应用程序数据文件夹的完整路径和名称."],
    ["A_Desktop", "当前用户的桌面文件夹的完整路径和名称."],
    ["A_DesktopCommon", "所有用户的桌面文件夹的完整路径和名称."],
    ["A_StartMenu", "当前用户的开始菜单文件夹的完整路径和名称."],
    ["A_StartMenuCommon", "所有用户的开始菜单文件夹的完整路径和名称."],
    ["A_Programs", "当前用户的开始菜单中程序文件夹的完整路径和名称."],
    ["A_ProgramsCommon", "所有用户的开始菜单中程序文件夹的完整路径和名称."],
    ["A_Startup", "当前用户的开始菜单中启动文件夹的完整路径和名称."],
    ["A_StartupCommon", "所有用户的开始菜单中启动文件夹的完整路径和名称."],
    ["A_MyDocuments", "当前用户 \"我的文档\" 文件夹的完整路径和名称. 与大多数类似变量不同, 当此文件夹为驱动器的根目录时, 此变量的值不包含最后的反斜杠. 例如, 它的值是 M: 而不是 M:\\"],
    ["A_IsAdmin", "如果当前用户有管理员权限, 则此变量的值为 1. 否则为 0.  \n 要使脚本以管理员权限重新启动(或显示提示向用户请求管理员权限), 请使用 Run *RunAs. 但是请注意, 以管理员权限运行脚本会导致脚本启动的所有程序也以管理员权限运行. 对于可能的替代方案, 请参阅常见问题(FAQ)."],
    ["A_ScreenWidth", "主监视器的宽度和高度, 单位为像素(例如 1024 和 768). 要获取多显示器系统中其他显示器的尺寸, 请使用 SysGet."],
    ["A_ScreenHeight", "主监视器的宽度和高度, 单位为像素(例如 1024 和 768). 要获取多显示器系统中其他显示器的尺寸, 请使用 SysGet.  \n 要获取整个桌面(即使它横跨多个显示器)的宽度和高度, 请使用下面的例子:\\n SysGet, VirtualWidth, 78  \n SysGet, VirtualHeight, 79  \n 此外, 使用 SysGet 可以获取显示器的工作区域, 它比显示器的整个区域小, 因为它不包括任务栏和其他注册的桌面工具栏."],
    ["A_ScreenDPI", "[v1.1.11+] 在屏幕宽度上每逻辑寸的像素数. 在多显示器的系统中, 这个值对于所有的显示器都是一样的. 在大多数系统中该值为 96; 它取决于系统文本大小(DPI)设置. 另请参阅 Gui -DPIScale."],
    ["A_IPAddress1", "计算机中前 4 个网卡的 IP 地址."],
    ["A_IPAddress2", "计算机中前 4 个网卡的 IP 地址."],
    ["A_IPAddress3", "计算机中前 4 个网卡的 IP 地址."],
    ["A_IPAddress4", "计算机中前 4 个网卡的 IP 地址."],
    ["A_Cursor", "当前显示的鼠标光标类型. 其值为下列单词的其中一个: AppStarting(程序启动, 后台运行--箭头+等待), Arrow(箭头, 正常选择--标准光标), Cross(十字, 精确选择), Help(帮助, 帮助选择--箭头+问号), IBeam(工字光标, 文本选择--输入), Icon, No(No, 不可用--圆圈加反斜杠), Size, SizeAll(所有尺寸,移动--四向箭头), SizeNESW(东南和西北尺寸, 沿对角线调整 2--双箭头指向东南和西北), SizeNS(南北尺寸, 垂直调整--双箭头指向南北), SizeNWSE(西北和东南尺寸, 沿对角线调整 1--双箭头指向西北和东南), SizeWE(东西尺寸, 水平调整--双箭头指向东西), UpArrow(向上箭头, 候选--指向上的箭头), Wait(等待, 忙--沙漏或圆圈), Unknown(未知). 与 size 指针类型一起的首字母表示方向, 例如 NESW = NorthEast(东北)+SouthWest(西南). 手型指针(点击和抓取) 属于 Unknown 类别."],
    ["A_CaretX", "当前光标(文本插入点) 的 X 和 Y 坐标. 如果没有使用 CoordMode 使得坐标相对于整个屏幕, 默认坐标相对于活动窗口. 如果没有活动窗口或无法确定文本插入点的位置, 则这两个变量为空.  \n 下面这个脚本可以让您在四处移动文本插入点时, 查看显示在自动更新工具提示上的当前位置. 注意在某些窗口(例如某些版本的 MS Word) 会不管文本插入点的实际位置如何都报告同样的位置. #Persistent  \n SetTimer, WatchCaret, 100  \n return  \n WatchCaret:  \n ToolTip, X%A_CaretX% Y%A_CaretY%, A_CaretX, A_CaretY - 20  \n return"],
    ["A_CaretY", "当前光标(文本插入点) 的 X 和 Y 坐标. 如果没有使用 CoordMode 使得坐标相对于整个屏幕, 默认坐标相对于活动窗口. 如果没有活动窗口或无法确定文本插入点的位置, 则这两个变量为空.  \n  下面这个脚本可以让您在四处移动文本插入点时, 查看显示在自动更新工具提示上的当前位置. 注意在某些窗口(例如某些版本的 MS Word) 会不管文本插入点的实际位置如何都报告同样的位置. #Persistent  \n SetTimer, WatchCaret, 100  \n return  \n WatchCaret:  \n ToolTip, X%A_CaretX% Y%A_CaretY%, A_CaretX, A_CaretY - 20  \n return"],
    ["Clipboard", "可读取/写入: 操作系统剪贴板的内容, 可以从中读取或写入内容. 请参阅剪贴板章节."],
    ["ClipboardAll", "可读取/写入: 剪贴板中的完整内容(包含格式和文本). 请参阅 ClipboardAll."],
    ["ErrorLevel", "可读取/写入: 请参阅 ErrorLevel."],
    ["A_LastError", "操作系统 GetLastError() 函数或最近 COM 对象调用返回的结果. 要了解详情, 请参阅 DllCall() 和 Run/RunWait."],
    ["A_Index", "当前循环重复的次数(64 位整数). 例如, 当脚本首次执行此循环体时, 此变量的值为 1. 要了解详情请参阅 Loop 或 While 循环."],
    ["A_LoopFileName", "此变量仅在文件循环中有效. 当前获取的文件或文件夹的名称(不含路径)."],
    ["A_LoopFileExt", "此变量仅在文件循环中有效. 当前文件的扩展名(例如 TXT, DOC 或 EXE). 不含句点(.)."],
    ["A_LoopFileFullPath", "此变量仅在文件循环中有效. 当前获取的文件/文件夹的路径和名称. 如果 FilePattern 包含相对路径而不是绝对路径, 那么这里的路径也是相对路径. 此外, FilePattern 中的任何短(8.3) 文件夹名称仍将为短名称(请参阅下一项来获取长名称).  \n A_LoopFilePath 可以在 [v1.1.28+] 中使用, 作为 A_LoopFileFullPath 的别名, A_LoopFileFullPath 是一个错误的用词."],
    ["A_LoopFilePath", "此变量仅在文件循环中有效. 当前获取的文件/文件夹的路径和名称. 如果 FilePattern 包含相对路径而不是绝对路径, 那么这里的路径也是相对路径. 此外, FilePattern 中的任何短(8.3) 文件夹名称仍将为短名称(请参阅下一项来获取长名称).  \n A_LoopFilePath 可以在 [v1.1.28+] 中使用, 作为 A_LoopFileFullPath 的别名, A_LoopFileFullPath 是一个错误的用词."],
    ["A_LoopFileLongPath", "此变量仅在文件循环中有效. 此变量与 A_LoopFileFullPath 有以下不同之处: 1) 不论 FilePattern 包含的是否为相对路径, 它总是包含文件的绝对/完整路径; 2) 在 FilePattern 中的任何短(8.3) 文件夹名称被转换成它们的长名称; 3) 在 FilePattern 中的字符被转换成与文件系统中存储的名称一致的大小写形式. 把文件名转换为资源管理器中显示的准确路径名称时这很有用, 例如作为命令行参数传递给脚本的那些."],
    ["A_LoopFileShortPath", "此变量仅在文件循环中有效. 当前获取的文件/文件夹的 8.3 短路径和名称. 例如: C:\\MYDOCU~1\\ADDRES~1.txt. 如果 FilePattern 包含相对路径而不是绝对路径, 那么这里的路径也是相对路径. `n 要获取单个文件或文件夹的完整的 8.3 路径和名称, 像这个例子那样在 FilePattern 中指定其名称:  \n Loop, C:\\My Documents\\Address List.txt  \n    ShortPathName = %A_LoopFileShortPath%  \n 注意: 如果文件没有短名称, 那么此变量将为 空, 这种情况会发生在注册表中设置了 NtfsDisable8dot3NameCreation 的系统上. 如果 FilePattern 包含相对路径且循环体中使用 SetWorkingDir 从当前循环的有效的工作目录中切换出来, 那么它也将为空."],
    ["A_LoopFileShortName", "此变量仅在文件循环中有效. 8.3 短名称或文件的备用名称. 如果文件没有此名称(由于长名称比 8.3 形式更短或也许因为在 NTFS 文件系统上禁止生成短名称), 将获取 A_LoopFileName 作为代替."],
    ["A_LoopFileDir", "此变量仅在文件循环中有效. A_LoopFileName 所在目录的路径. 如果 FilePattern 包含相对路径而不是绝对路径, 那么这里的路径也是相对路径. 根目录将不包含末尾的反斜杠. 例如: C:"],
    ["A_LoopFileTimeModified", "此变量仅在文件循环中有效. 文件的上次修改时间. 格式为 YYYYMMDDHH24MISS."],
    ["A_LoopFileTimeCreated", "此变量仅在文件循环中有效. 文件的创建时间. 格式为 YYYYMMDDHH24MISS."],
    ["A_LoopFileTimeAccessed", "此变量仅在文件循环中有效. 文件的上次访问时间. 格式为 YYYYMMDDHH24MISS."],
    ["A_LoopFileAttrib", "此变量仅在文件循环中有效. 当前获取的文件的属性."],
    ["A_LoopFileSize", "此变量仅在文件循环中有效. 以字节为单位的当前获取的文件的大小. 同样支持大于 4 GB 的文件."],
    ["A_LoopFileSizeKB", "此变量仅在文件循环中有效. 以 KB 为单位的当前获取的文件的大小, 向下取整到最近的整数."],
    ["A_LoopFileSizeMB", "此变量仅在文件循环中有效. 以 MB 为单位的当前获取的文件的大小, 向下取整到最近的整数."],
    ["A_LoopRegName", "此变量仅在注册表循环Loop, Reg中有效. 当前获取项的名称, 可以是值名或子键名. 在 Windows 注册表编辑器中, 值名为 \"(默认)\" 的项如果分配了值, 那么也会获取它的值, 不过此时相应的 A_LoopRegName 将是空的."],
    ["A_LoopRegType", "此变量仅在注册表循环Loop, Reg中有效. 当前获取项的类型, 可以是下列单词的其中一个: KEY(即当前获取项为子键而不是值), REG_SZ, REG_EXPAND_SZ, REG_MULTI_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_LINK, REG_RESOURCE_LIST, REG_FULL_RESOURCE_DESCRIPTOR, REG_RESOURCE_REQUIREMENTS_LIST, REG_DWORD_BIG_ENDIAN(在大多数 Windows 硬件上相当罕见). 如果当前获取项为未知类型, 那么此变量将为空."],
    ["A_LoopRegKey", "此变量仅在注册表循环Loop, Reg中有效. 正在访问的根键名(HKEY_LOCAL_MACHINE, HKEY_USERS, HKEY_CURRENT_USER, HKEY_CLASSES_ROOT 或 HKEY_CURRENT_CONFIG). 访问远程注册表时, 此变量的值将不包含计算机名."],
    ["A_LoopRegSubKey", "此变量仅在注册表循环Loop, Reg中有效. 当前子键名. 如果没有使用 Recurse 参数以递归查询其他子键时, 此变量的值与 Key 参数相同. 在递归查询时, 此变量的值将为当前获取项的完整路径, 其中不包含根键. 例如: Software\\SomeApplication\\My SubKey"],
    ["A_LoopRegTimeModified", "此变量仅在注册表循环Loop, Reg中有效. 当前子键或其中任何一个值的上次修改时间. 格式为 YYYYMMDDHH24MISS. 当前获取项不是子键(即 A_LoopRegType 不是单词 KEY) 时,此变量将为空."],
    ["A_LoopReadLine", "请参阅文件读取循环loop, files. 当前获取的文件或文件夹的名称(不含路径)."],
    ["A_LoopField", "请参阅解析循环Loop, Parse. 它包含了 InputVar 中当前子字符串(片段) 的内容. 如果一个内层解析循环包含在一个外层解析循环中, 则最内层循环的片段将具有优先权."]
]

export const builtin_function = [
    {
        "name": "Abs",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ACos",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Asc",
        "params": [
            {
                "name": "String",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ASin",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ATan",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Ceil",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Chr",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Cos",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "DllCall",
        "params": [
            {
                "name": "DllFile\\Function",
                "isOptional": false
            },
            {
                "name": "Type1",
                "isOptional": true
            },
            {
                "name": "Arg1",
                "isOptional": true
            },
            {
                "name": "Type2",
                "isOptional": true
            },
            {
                "name": "Arg2",
                "isOptional": true
            },
            {
                "name": "...",
                "isOptional": true
            },
            {
                "name": "\"Cdecl ReturnType\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Exception",
        "params": [
            {
                "name": "Message",
                "isOptional": false
            },
            {
                "name": "What",
                "isOptional": true
            },
            {
                "name": "Extra",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Exp",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "FileExist",
        "params": [
            {
                "name": "FilePattern",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Floor",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "GetKeyState",
        "params": [
            {
                "name": "KeyName",
                "isOptional": false
            },
            {
                "name": "\"P\" or \"T\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "IL_Add",
        "params": [
            {
                "name": "ImageListID",
                "isOptional": false
            },
            {
                "name": "Filename",
                "isOptional": false
            },
            {
                "name": "IconNumber",
                "isOptional": true
            },
            {
                "name": "ResizeNonIcon?",
                "isOptional": true
            }
        ]
    },
    {
        "name": "IL_Create",
        "params": [
            {
                "name": "nitialCount",
                "isOptional": true
            },
            {
                "name": "GrowCount",
                "isOptional": true
            },
            {
                "name": "LargeIcons?",
                "isOptional": true
            }
        ]
    },
    {
        "name": "IL_Destroy",
        "params": [
            {
                "name": "ImageListID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "InStr",
        "params": [
            {
                "name": "Haystack",
                "isOptional": false
            },
            {
                "name": "Needle",
                "isOptional": false
            },
            {
                "name": "CaseSensitive?",
                "isOptional": true
            },
            {
                "name": "StartingPos",
                "isOptional": true
            },
            {
                "name": "Occurrence",
                "isOptional": true
            }
        ]
    },
    {
        "name": "IsFunc",
        "params": [
            {
                "name": "FunctionName",
                "isOptional": false
            }
        ]
    },
    {
        "name": "IsLabel",
        "params": [
            {
                "name": "LabelName",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Ln",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Log",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "LV_Add",
        "params": [
            {
                "name": "ptions",
                "isOptional": true
            },
            {
                "name": "Col*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_Delete",
        "params": [
            {
                "name": "owNumber",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_DeleteCol",
        "params": [
            {
                "name": "ColumnNumber",
                "isOptional": false
            }
        ]
    },
    {
        "name": "LV_GetCount",
        "params": [
            {
                "name": "\"S|C\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_GetNext",
        "params": [
            {
                "name": "tartingRowNumber",
                "isOptional": true
            },
            {
                "name": "\"C|F\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_GetText",
        "params": [
            {
                "name": "OutputVar",
                "isOptional": false
            },
            {
                "name": "RowNumber",
                "isOptional": false
            },
            {
                "name": "ColumnNumber",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_Insert",
        "params": [
            {
                "name": "RowNumber",
                "isOptional": false
            },
            {
                "name": "Options",
                "isOptional": true
            },
            {
                "name": "Col*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_InsertCol",
        "params": [
            {
                "name": "ColumnNumber",
                "isOptional": false
            },
            {
                "name": "Options",
                "isOptional": true
            },
            {
                "name": "ColumnTitle",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_Modify",
        "params": [
            {
                "name": "RowNumber",
                "isOptional": false
            },
            {
                "name": "Options",
                "isOptional": false
            },
            {
                "name": "NewCol1*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_ModifyCol",
        "params": [
            {
                "name": "olumnNumber",
                "isOptional": true
            },
            {
                "name": "Options",
                "isOptional": true
            },
            {
                "name": "ColumnTitle",
                "isOptional": true
            }
        ]
    },
    {
        "name": "LV_SetImageList",
        "params": [
            {
                "name": "ImageListID",
                "isOptional": false
            },
            {
                "name": "0|1|2",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Mod",
        "params": [
            {
                "name": "Dividend",
                "isOptional": false
            },
            {
                "name": "Divisor",
                "isOptional": false
            }
        ]
    },
    {
        "name": "NumGet",
        "params": [
            {
                "name": "VarOrAddress",
                "isOptional": false
            },
            {
                "name": "Offset",
                "isOptional": true,
                "defaultVal": "0"
            },
            {
                "name": "Type",
                "isOptional": true,
                "defaultVal": "\"UPtr\""
            }
        ]
    },
    {
        "name": "NumPut",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            },
            {
                "name": "VarOrAddress",
                "isOptional": false
            },
            {
                "name": "Offset",
                "isOptional": true,
                "defaultVal": "0"
            },
            {
                "name": "Type",
                "isOptional": true,
                "defaultVal": "\"UPtr\""
            }
        ]
    },
    {
        "name": "OnMessage",
        "params": [
            {
                "name": "MsgNumber",
                "isOptional": false
            },
            {
                "name": "FunctionName",
                "isOptional": true
            }
        ]
    },
    {
        "name": "RegExMatch",
        "params": [
            {
                "name": "Haystack",
                "isOptional": false
            },
            {
                "name": "NeedleRegEx",
                "isOptional": false
            },
            {
                "name": "UnquotedOutputVar",
                "isOptional": true,
                "defaultVal": "\"\""
            },
            {
                "name": "StartingPos",
                "isOptional": true,
                "defaultVal": "1"
            }
        ]
    },
    {
        "name": "RegExReplace",
        "params": [
            {
                "name": "Haystack",
                "isOptional": false
            },
            {
                "name": "NeedleRegEx",
                "isOptional": false
            },
            {
                "name": "Replacement",
                "isOptional": true,
                "defaultVal": "\"\""
            },
            {
                "name": "OutputVarCount",
                "isOptional": true,
                "defaultVal": "\"\""
            },
            {
                "name": "Limit",
                "isOptional": true,
                "defaultVal": "-1"
            },
            {
                "name": "StartingPos",
                "isOptional": true,
                "defaultVal": "1"
            }
        ]
    },
    {
        "name": "RegisterCallback",
        "params": [
            {
                "name": "FunctionName",
                "isOptional": false
            },
            {
                "name": "Options",
                "isOptional": true,
                "defaultVal": "\"\""
            },
            {
                "name": "ParamCount",
                "isOptional": true,
                "defaultVal": "FormalCount"
            },
            {
                "name": "EventInfo",
                "isOptional": true,
                "defaultVal": "Address"
            }
        ]
    },
    {
        "name": "Round",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            },
            {
                "name": "Places",
                "isOptional": true
            }
        ]
    },
    {
        "name": "SB_SetIcon",
        "params": [
            {
                "name": "Filename",
                "isOptional": false
            },
            {
                "name": "IconNumber",
                "isOptional": true
            },
            {
                "name": "PartNumber",
                "isOptional": true
            }
        ]
    },
    {
        "name": "SB_SetParts",
        "params": [
            {
                "name": "idth*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "SB_SetText",
        "params": [
            {
                "name": "NewText",
                "isOptional": false
            },
            {
                "name": "PartNumber",
                "isOptional": true
            },
            {
                "name": "Style",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Sin",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Sqrt",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "StrLen",
        "params": [
            {
                "name": "String",
                "isOptional": false
            }
        ]
    },
    {
        "name": "SubStr",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "StartingPos",
                "isOptional": false
            },
            {
                "name": "Length",
                "isOptional": true
            }
        ]
    },
    {
        "name": "StrSplit",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "Delimiters",
                "isOptional": true
            },
            {
                "name": "OmitChars",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Tan",
        "params": [
            {
                "name": "Number",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_Add",
        "params": [
            {
                "name": "Name",
                "isOptional": false
            },
            {
                "name": "",
                "isOptional": false
            },
            {
                "name": "arentItemID",
                "isOptional": true
            },
            {
                "name": "Options",
                "isOptional": true
            }
        ]
    },
    {
        "name": "TV_Delete",
        "params": [
            {
                "name": "temID",
                "isOptional": true
            }
        ]
    },
    {
        "name": "TV_GetChild",
        "params": [
            {
                "name": "ParentItemID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_GetCount",
        "params": []
    },
    {
        "name": "TV_GetNext",
        "params": [
            {
                "name": "temID",
                "isOptional": true
            },
            {
                "name": "\"Checked | Full\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "TV_Get",
        "params": [
            {
                "name": "ItemID",
                "isOptional": false
            },
            {
                "name": "\"Expand | Check | Bold\"",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_GetParent",
        "params": [
            {
                "name": "ItemID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_GetPrev",
        "params": [
            {
                "name": "ItemID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_GetSelection",
        "params": []
    },
    {
        "name": "TV_GetText",
        "params": [
            {
                "name": "OutputVar",
                "isOptional": false
            },
            {
                "name": "ItemID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "TV_Modify",
        "params": [
            {
                "name": "ItemID",
                "isOptional": false
            },
            {
                "name": "Options",
                "isOptional": true
            },
            {
                "name": "NewName",
                "isOptional": true
            }
        ]
    },
    {
        "name": "TV_SetImageList",
        "params": [
            {
                "name": "ImageList",
                "isOptional": false
            },
            {
                "name": "0|2",
                "isOptional": true
            }
        ]
    },
    {
        "name": "VarSetCapacity",
        "params": [
            {
                "name": "Var",
                "isOptional": false
            },
            {
                "name": "RequestedCapacity",
                "isOptional": true
            },
            {
                "name": "FillByte",
                "isOptional": true
            }
        ]
    },
    {
        "name": "WinActive",
        "params": [
            {
                "name": "WinTitle\"",
                "isOptional": true
            },
            {
                "name": "\"WinText\"",
                "isOptional": true
            },
            {
                "name": "\"ExcludeTitle\"",
                "isOptional": true
            },
            {
                "name": "\"ExcludeText\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "WinExist",
        "params": [
            {
                "name": "WinTitle\"",
                "isOptional": true
            },
            {
                "name": "\"WinText\"",
                "isOptional": true
            },
            {
                "name": "\"ExcludeTitle\"",
                "isOptional": true
            },
            {
                "name": "\"ExcludeText\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Trim",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "OmitChars",
                "isOptional": true,
                "defaultVal": "\" `t\""
            }
        ]
    },
    {
        "name": "LTrim",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "OmitChars",
                "isOptional": true,
                "defaultVal": "\" `t\""
            }
        ]
    },
    {
        "name": "RTrim",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "OmitChars",
                "isOptional": true,
                "defaultVal": "\" `t\""
            }
        ]
    },
    {
        "name": "FileOpen",
        "params": [
            {
                "name": "Filename",
                "isOptional": false
            },
            {
                "name": "Flags",
                "isOptional": false
            },
            {
                "name": "Encoding",
                "isOptional": true
            }
        ]
    },
    {
        "name": "StrGet",
        "params": [
            {
                "name": "Address",
                "isOptional": false
            },
            {
                "name": "Max",
                "isOptional": true
            },
            {
                "name": "Encoding",
                "isOptional": true
            }
        ]
    },
    {
        "name": "StrPut",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "Encoding",
                "isOptional": true
            }
        ]
    },
    {
        "name": "StrPut",
        "params": [
            {
                "name": "String",
                "isOptional": false
            },
            {
                "name": "Address",
                "isOptional": false
            },
            {
                "name": "Max",
                "isOptional": true
            },
            {
                "name": "Encoding",
                "isOptional": true
            }
        ]
    },
    {
        "name": "GetKeyName",
        "params": [
            {
                "name": "Key",
                "isOptional": false
            }
        ]
    },
    {
        "name": "GetKeyVK",
        "params": [
            {
                "name": "Key",
                "isOptional": false
            }
        ]
    },
    {
        "name": "GetKeySC",
        "params": [
            {
                "name": "Key",
                "isOptional": false
            }
        ]
    },
    {
        "name": "IsByRef",
        "params": [
            {
                "name": "Var",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Object",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            }
        ]
    },
    {
        "name": "Object",
        "params": [
            {
                "name": "ey*",
                "isOptional": true
            },
            {
                "name": "Value*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Array",
        "params": [
            {
                "name": "alue*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "IsObject",
        "params": [
            {
                "name": "Parameter",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ObjBindMethod",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            },
            {
                "name": "Method",
                "isOptional": false
            },
            {
                "name": "Params*",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjCreate",
        "params": [
            {
                "name": "ProgIdOrCLSID",
                "isOptional": false
            },
            {
                "name": "IID",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjGet",
        "params": [
            {
                "name": "Name",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjConnect",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            },
            {
                "name": "FuncPrefixOrObj",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjError",
        "params": [
            {
                "name": "nable",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjActive",
        "params": [
            {
                "name": "ProgIdOrCLSID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjEnwrap",
        "params": [
            {
                "name": "Pdisp",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjUnwrap",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjParameter",
        "params": [
            {
                "name": "VarType",
                "isOptional": false
            },
            {
                "name": "Value",
                "isOptional": false
            },
            {
                "name": "Flags",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjType",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            },
            {
                "name": "\"Name|IID\"",
                "isOptional": true
            }
        ]
    },
    {
        "name": "ComObjValue",
        "params": [
            {
                "name": "Obj",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjMissing",
        "params": []
    },
    {
        "name": "ComObjArray",
        "params": [
            {
                "name": "VarType",
                "isOptional": false
            },
            {
                "name": "Count*",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjQuery",
        "params": [
            {
                "name": "ComObject",
                "isOptional": false
            },
            {
                "name": "SID",
                "isOptional": true
            },
            {
                "name": "IID",
                "isOptional": false
            }
        ]
    },
    {
        "name": "ComObjFlags",
        "params": [
            {
                "name": "ComObject",
                "isOptional": false
            },
            {
                "name": "NewFlags",
                "isOptional": true
            },
            {
                "name": "Mask",
                "isOptional": true
            }
        ]
    },
    {
        "name": "Func",
        "params": [
            {
                "name": "Funcname",
                "isOptional": false
            }
        ]
    }
]