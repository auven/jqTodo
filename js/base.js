/**
 * Created by auven on 2017/4/29.
 */

// 把所有的变量包含在这函数里，不会污染全局变量。
// ;防止前面的引入的js未写分号
;(function () {
    'use strict';

    var formAddTask = $('.add-task')
        , deleteTask
        , taskDetail
        , taskDetailWrap = $('.task-detail')
        , taskDetailMask = $('.task-detail-mask')
        , taskList = []
        , currentIndex
        , updateForm
        , taskDetailContent
        , taskDetailContentInput
        , checkboxComplete
    ;

    init();

    // 初始化
    function init() {
        // store.clearAll(); // 清空localStorage
        taskList = store.get('taskList') || [];
        if (taskList.length)
            renderTaskList();

        taskRemindCheck();
        listenMsgEvent();
    }

    formAddTask.on('submit', function (e) {
        var newTask = {};

        // 禁用默认行为
        // e.preventDefault();
        // 获取新task值
        newTask.content = $(this).find('input[name=content]').val();
        // 如果为空，退出，否则继续执行
        if (!newTask.content) return;
        if (addTask(newTask)) {
            $(this).find('input[name=content]').val('');
        }
    });

    taskDetailMask.on('click', hideTaskDetail);

    // 禁用默认行为，解决移动端bug
    document.addEventListener('submit',function (event) {
        event.preventDefault();
    });

    // 添加任务
    function addTask(newTask) {
        taskList.unshift(newTask);
        refreshTaskList();
        return true;
    }

    // 更新视图
    function updateTask(index, data) {
        taskList[index] = $.extend({}, taskList[index], data);
        refreshTaskList();
    }

    // 刷新清单列表
    function refreshTaskList() {
        store.set('taskList', taskList);
        renderTaskList();
    }

    // 渲染清单列表
    function renderTaskList() {
        var taskListDom = $('.task-list');
        var taskListCompleteDom = $('.task-list-complete');
        taskListDom.html('');
        taskListCompleteDom.html('');
        for (var i = 0; i < taskList.length; i++) {
            var $task = renderTaskItem(taskList[i], i);
            if (taskList[i].complete) {
                taskListCompleteDom.append($task);
            } else {
                taskListDom.append($task);
            }
        }

        // 渲染完成后才去绑定dom元素
        deleteTask = $('.delete');
        taskDetail = $('.detail');
        checkboxComplete = $('.complete');
        listenTaskDelete();
        listenTaskDetail();
        listenCheckboxComplete();
    }

    // 渲染清单（单条）
    function renderTaskItem(data, index) {
        var list_item_tpl = `
            <div class="task-item" data-index="${index}">
                <span><input class="complete" type="checkbox" ${data.complete ? 'checked' : ''}></span>
                <span class="task-content">${data.content}</span>
                <span class="fr">
                    <span class="action delete">删除</span>
                    <span class="action detail">详细</span>
                </span>
            </div>
        `;

        return $(list_item_tpl);
    }

    // 监听删除按钮
    function listenTaskDelete() {
        deleteTask.on('click', function (e) {
            var self = $(this);
            var item = self.parent().parent();
            var index = item.data('index');
            var tmp = confirm('确定删除？');
            tmp ? deleteTaskFn(index) : null;
        });
    }

    // 删除
    function deleteTaskFn(index) {
        if (index === undefined || !taskList[index]) return;

        taskList.splice(index, 1);
        refreshTaskList();
    }

    // 监听详情按钮
    function listenTaskDetail() {
        // $('.task-item').on('dblclick', function () {
        //     var self = $(this);
        //     var index = self.data('index');
        //     showTaskDetail(index);
        // });

        // 解决在移动端下无法双击
        var i = 0;
        $('.task-item').on('click', function () {
            i++;
            setTimeout(function () {
                i = 0;
            }, 500);
            if (i > 1) {
                var self = $(this);
                var index = self.data('index');
                showTaskDetail(index);
                i = 0;
            }
        });

        taskDetail.on('click', function () {
            var self = $(this);
            var item = self.parent().parent();
            var index = item.data('index');
            showTaskDetail(index);
        })
    }

    // 显示任务详情
    function showTaskDetail(index) {
        renderTaskDetail(index);
        currentIndex = index;
        taskDetailWrap.show();
        taskDetailMask.show();
    }

    // 渲染任务详情
    function renderTaskDetail(index) {
        taskDetailWrap.html('');

        var item = taskList[index];
        var task_detail_tpl = `
            <form>
                <div class="content"><!-- 任务标题开始 -->
                    ${item.content}
                </div><!-- 任务标题结束 -->
                <div class="input-item"><input type="text" style="display:none" name="content" value="${item.content}"></div>
                <div class="input-item"><!-- 任务描述开始 -->
                    <textarea name="desc">${item.desc || ''}</textarea>
                </div><!-- 任务描述结束 -->
                <div class="remind input-item"><!-- 任务定时提醒开始 -->
                    <label>提醒时间</label>
                    <input class="datetime" name="remind_date" type="text" value="${item.remind_date || ''}">
                </div><!-- 任务定时提醒结束 -->
                <div class="input-item">
                    <button type="submit">更新</button>
                </div>
            </form>
        `;

        taskDetailWrap.append(task_detail_tpl);
        updateForm = taskDetailWrap.find('form');
        taskDetailContent = taskDetailWrap.find('.content');
        taskDetailContentInput = taskDetailWrap.find('[name=content]');

        // 将原先生成的datetimepicker移除
        $('.xdsoft_datetimepicker.xdsoft_noselect.xdsoft_').remove();
        $('.datetime').datetimepicker();

        var i = 0;
        taskDetailContent.on('click', function () {
            i++;
            setTimeout(function () {
                i = 0;
            }, 500);
            if (i > 1) {
                taskDetailContentInput.show();
                taskDetailContent.hide();
                i = 0;
            }
        });

        var informed = false;
        $('.datetime').on('change', function () {
            informed = true;
        });

        updateForm.on('submit', function (e) {
            // e.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            if (informed) data.informed = false;
            updateTask(index, data);
            hideTaskDetail();
        })
    }

    // 隐藏任务详情
    function hideTaskDetail() {
        taskDetailWrap.hide();
        taskDetailMask.hide();
    }

    // 监听任务选中事件
    function listenCheckboxComplete() {
        checkboxComplete.on('click', function () {
            var self = $(this);
            var is_complete = $(this).is(':checked');
            var index = self.parent().parent().data('index');

            updateTask(index, {complete: is_complete});
        })
    }


    // 检查任务提醒时间是否到期
    function taskRemindCheck() {
        // 每0.3毫秒检查一次
        var itl = setInterval(function () {
            for (var i = 0; i < taskList.length; i++) {
                // 如果存在提醒时间，并且未提醒，则进行下一个步骤
                if (taskList[i].remind_date && !taskList[i].informed) {
                    var task_timestamp = (new Date(taskList[i].remind_date)).getTime();
                    var current_timestamp = (new Date()).getTime();
                    // 如果提醒时间小于当前时间，则触发提醒事件
                    if (current_timestamp - task_timestamp >= 1) {
                        // 标记为已触发，更新视图
                        updateTask(i, {informed: true});
                        showMsg(taskList[i].content);
                    }
                }
            }
        }, 300);

    }

    // 显示任务提醒
    function showMsg(msg) {
        $('.msg .msg-content').html(msg);
        $('.msg').show();
    }

    // 隐藏任务提醒
    function hideMsg() {
        $('.msg').hide();
    }

    // 监听任务提醒--'知道了'按钮
    function listenMsgEvent() {
        $('.msg-btn').on('click', function () {
            hideMsg();
        })
    }

})();